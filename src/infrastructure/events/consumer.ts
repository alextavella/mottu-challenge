/* eslint-disable @typescript-eslint/no-explicit-any */

import { Channel, ConsumeMessage } from 'amqplib';
import { RabbitMQConnection } from './connection';
import { BaseEvent, ConsumerOptions, EventHandler } from './types';

interface ConsumerRegistration {
  eventType: string;
  handler: EventHandler<any>;
  options: Required<ConsumerOptions>;
  consumerTag?: string;
}

export class RabbitMQEventConsumer {
  private channel: Channel | null = null;
  private consumers: Map<string, ConsumerRegistration> = new Map();
  private isStarted = false;
  private readonly exchangeName: string;

  constructor(
    private connection: RabbitMQConnection,
    exchangeName = 'events',
  ) {
    this.exchangeName = exchangeName;
  }

  async subscribe<T extends BaseEvent>(
    eventType: string,
    handler: EventHandler<T>,
    options: ConsumerOptions = {},
  ): Promise<void> {
    const consumerOptions: Required<ConsumerOptions> = {
      queue: options.queue || `${eventType}.queue`,
      exchange: options.exchange || this.exchangeName,
      routingKey: options.routingKey || eventType,
      prefetch: options.prefetch || 10,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      deadLetterExchange:
        options.deadLetterExchange || `${this.exchangeName}.dlx`,
    };

    this.consumers.set(eventType, {
      eventType,
      handler,
      options: consumerOptions,
    });

    if (this.isStarted) {
      await this.startConsumer(eventType, this.consumers.get(eventType)!);
    }

    console.log(`Subscribed to event type: ${eventType}`);
  }

  async start(): Promise<void> {
    if (this.isStarted) return;

    this.channel = await this.connection.createChannel('consumer');

    // Set prefetch for the channel (will be overridden per consumer if needed)
    await this.channel.prefetch(10);

    // Declare main exchange
    await this.channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });

    // Declare dead letter exchange
    await this.channel.assertExchange(`${this.exchangeName}.dlx`, 'topic', {
      durable: true,
    });

    // Start all registered consumers
    for (const [eventType, consumer] of this.consumers) {
      await this.startConsumer(eventType, consumer);
    }

    this.isStarted = true;
    console.log('Event consumer started');
  }

  private async startConsumer(
    eventType: string,
    consumer: ConsumerRegistration,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Consumer channel not initialized');
    }

    const { handler, options } = consumer;

    // Declare dead letter queue
    const dlqName = `${options.queue}.dlq`;
    await this.channel.assertQueue(dlqName, {
      durable: true,
    });

    // Bind dead letter queue to dead letter exchange
    await this.channel.bindQueue(
      dlqName,
      options.deadLetterExchange,
      eventType,
    );

    // Declare main queue with dead letter configuration
    await this.channel.assertQueue(options.queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': options.deadLetterExchange,
        'x-dead-letter-routing-key': eventType,
        'x-message-ttl': 30000, // 30 seconds TTL for retry
      },
    });

    // Bind queue to exchange
    await this.channel.bindQueue(
      options.queue,
      options.exchange,
      options.routingKey,
    );

    // Set prefetch for this consumer
    await this.channel.prefetch(options.prefetch);

    // Start consuming
    const { consumerTag } = await this.channel.consume(
      options.queue,
      async (msg) => {
        if (!msg) return;
        await this.handleMessage(msg, handler, options);
      },
      {
        noAck: false, // Manual acknowledgment
      },
    );

    consumer.consumerTag = consumerTag;
    console.log(`Started consumer for ${eventType} on queue ${options.queue}`);
  }

  private async handleMessage<T extends BaseEvent>(
    msg: ConsumeMessage,
    handler: EventHandler<T>,
    options: Required<ConsumerOptions>,
  ): Promise<void> {
    if (!this.channel) return;

    let event: T;

    try {
      // Parse the event from message content
      const content = msg.content.toString();
      const parsedEvent = JSON.parse(content);

      // Convert timestamp back to Date object
      event = {
        ...parsedEvent,
        timestamp: new Date(parsedEvent.timestamp),
      } as T;

      console.log(`Processing event: ${event.type} with ID ${event.id}`);
    } catch (error) {
      console.error('Failed to parse event message:', error);
      this.channel.nack(msg, false, false); // Reject and don't requeue
      return;
    }

    const retryCount = this.getRetryCount(msg);

    try {
      await handler.handle(event);
      this.channel.ack(msg);
      console.log(
        `Successfully processed event: ${event.type} with ID ${event.id}`,
      );
    } catch (error) {
      console.error(`Failed to process event ${event.id}:`, error);

      if (retryCount < options.retryAttempts) {
        // Retry with delay
        console.log(
          `Retrying event ${event.id} (attempt ${retryCount + 1}/${options.retryAttempts})`,
        );

        setTimeout(
          () => {
            if (this.channel) {
              this.channel.nack(msg, false, true); // Requeue for retry
            }
          },
          options.retryDelay * Math.pow(2, retryCount),
        ); // Exponential backoff
      } else {
        // Max retries reached, send to dead letter queue
        console.error(
          `Max retries reached for event ${event.id}, sending to DLQ`,
        );
        this.channel.nack(msg, false, false); // Don't requeue, will go to DLQ
      }
    }
  }

  private getRetryCount(msg: ConsumeMessage): number {
    const xDeathHeader = msg.properties.headers?.['x-death'];
    if (Array.isArray(xDeathHeader) && xDeathHeader.length > 0) {
      return xDeathHeader[0].count || 0;
    }
    return 0;
  }

  async stop(): Promise<void> {
    if (!this.isStarted) return;

    // Cancel all consumers
    for (const [, consumer] of this.consumers) {
      if (consumer.consumerTag && this.channel) {
        try {
          await this.channel.cancel(consumer.consumerTag);
          console.log(`Stopped consumer for ${consumer.eventType}`);
        } catch (error) {
          console.error(
            `Error stopping consumer for ${consumer.eventType}:`,
            error,
          );
        }
      }
    }

    // Close channel
    if (this.channel) {
      try {
        await this.channel.close();
      } catch (error) {
        console.error('Error closing consumer channel:', error);
      }
      this.channel = null;
    }

    this.isStarted = false;
    console.log('Event consumer stopped');
  }
}
