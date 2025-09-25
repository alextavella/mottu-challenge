/* eslint-disable @typescript-eslint/no-explicit-any */

import { Channel, ConsumeMessage } from 'amqplib';
import { ILogger } from '../config/logger';
import { RabbitMQConnection } from './connection';
import { BaseEvent, ConsumerOptions, IEventHandler } from './types';

interface ConsumerRegistration {
  eventType: string;
  handler: IEventHandler<any>;
  options: Required<ConsumerOptions>;
  consumerTag?: string;
  retryConsumerTag?: string;
  dlqConsumerTag?: string;
  dlqHandler?: IEventHandler<any>;
}

export class RabbitMQEventConsumer {
  private channel: Channel | null = null;
  private consumers: Map<string, ConsumerRegistration> = new Map();
  private isStarted = false;

  constructor(
    private logger: ILogger,
    private connection: RabbitMQConnection,
    private readonly exchangeName: string,
  ) {}

  async subscribe<T extends BaseEvent>(
    eventType: string,
    handler: IEventHandler<T>,
    options: ConsumerOptions = {},
  ): Promise<void> {
    const consumerOptions: Required<ConsumerOptions> = {
      queue: options.queue || `${eventType}.queue`,
      exchange: options.exchange || this.exchangeName,
      routingKey: options.routingKey || eventType,
      prefetch: options.prefetch || 10,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      deadLetterExchange: options.deadLetterExchange || this.exchangeName,
    };

    this.consumers.set(eventType, {
      eventType,
      handler,
      options: consumerOptions,
    });

    if (this.isStarted) {
      await this.startConsumer(eventType, this.consumers.get(eventType)!);
    }

    this.logger.info(`Subscribed to event type: ${eventType}`);
  }

  async setDLQHandler<T extends BaseEvent>(
    eventType: string,
    dlqHandler: IEventHandler<T>,
  ): Promise<void> {
    const consumer = this.consumers.get(eventType);
    if (consumer) {
      consumer.dlqHandler = dlqHandler;
      this.logger.info(`DLQ handler set for event type: ${eventType}`);
    } else {
      throw new Error(`Consumer for event type ${eventType} not found`);
    }
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

    // Start all registered consumers
    for (const [eventType, consumer] of this.consumers) {
      await this.startConsumer(eventType, consumer);
    }

    this.isStarted = true;
    this.logger.info('Event consumer started');
  }

  private async startConsumer(
    eventType: string,
    consumer: ConsumerRegistration,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Consumer channel not initialized');
    }

    const { handler, options } = consumer;

    const queueMain = options.queue;
    const queueRetry = `${queueMain}.retry`;
    const queueDLQ = `${queueMain}.dlq`;

    // Fila principal -> retry em caso de falha
    await this.channel.assertQueue(queueMain, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': options.exchange,
        'x-dead-letter-routing-key': queueRetry,
      },
    });

    // Fila de retry -> main após delay
    await this.channel.assertQueue(queueRetry, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': options.exchange,
        'x-dead-letter-routing-key': queueMain,
        'x-message-ttl': options.retryDelay,
      },
    });

    // Fila DLQ -> destino final
    await this.channel.assertQueue(queueDLQ, {
      durable: true,
    });

    // Garantir que a exchange existe antes de fazer bind
    await this.channel.assertExchange(options.exchange, 'topic', {
      durable: true,
    });
    this.logger.info(`[DEBUG] Exchange ${options.exchange} created/verified`);

    // Bind filas ao exchange
    await this.channel.bindQueue(
      queueMain,
      options.exchange,
      options.routingKey,
    );
    this.logger.info(
      `[DEBUG] Bound queue ${queueMain} to exchange ${options.exchange} with routing key ${options.routingKey}`,
    );

    // Bind fila de retry ao exchange
    await this.channel.bindQueue(queueRetry, options.exchange, queueRetry);
    this.logger.info(
      `[DEBUG] Bound retry queue ${queueRetry} to exchange ${options.exchange} with routing key ${queueRetry}`,
    );

    // Bind fila DLQ ao exchange
    await this.channel.bindQueue(queueDLQ, options.exchange, queueDLQ);
    this.logger.info(
      `[DEBUG] Bound DLQ ${queueDLQ} to exchange ${options.exchange} with routing key ${queueDLQ}`,
    );

    await this.channel.prefetch(options.prefetch);

    // Consumer fila principal
    const { consumerTag } = await this.channel.consume(
      queueMain,
      async (msg) => {
        if (!msg) return;
        await this.handleMessage(msg, handler, options);
      },
      { noAck: false },
    );

    // Consumer fila de retry
    const { consumerTag: retryConsumerTag } = await this.channel.consume(
      queueRetry,
      async (msg) => {
        if (!msg) return;
        await this.handleRetryMessage(msg, options);
      },
      { noAck: false },
    );

    // Consumer fila DLQ (para cancel handler)
    const { consumerTag: dlqConsumerTag } = await this.channel.consume(
      queueDLQ,
      async (msg) => {
        if (!msg) return;
        await this.handleDLQMessage(msg, consumer);
      },
      { noAck: false },
    );

    consumer.consumerTag = consumerTag;
    consumer.retryConsumerTag = retryConsumerTag;
    consumer.dlqConsumerTag = dlqConsumerTag;
    this.logger.info(
      `Started consumer for ${eventType} on queue ${queueMain}, retry queue ${queueRetry} and DLQ ${queueDLQ}`,
    );
  }

  private async handleMessage<T extends BaseEvent>(
    msg: ConsumeMessage,
    handler: IEventHandler<T>,
    options: Required<ConsumerOptions>,
  ): Promise<void> {
    if (!this.channel) return;

    let event: T;

    try {
      event = this.parseEvent<T>(msg);
      this.logger.info(
        `[DEBUG] Processando evento: ${event.type} (${event.id}) - Queue: ${options.queue}`,
      );
      this.logger.info(
        `[DEBUG] Event data: ${JSON.stringify((event as any).data, null, 2)}`,
      );
    } catch (error) {
      this.logger.error('Erro ao parsear evento:', error);
      this.channel.nack(msg, false, false);
      return;
    }

    const retryCount = this.getRetryCount(msg);

    try {
      await handler.handle(event);
      this.channel.ack(msg);
      this.logger.info(`Evento processado: ${event.id}`);
    } catch (error) {
      this.logger.error(`Erro ao processar evento ${event.id}:`, error);

      if (retryCount < options.retryAttempts) {
        const nextRetryCount = retryCount + 1;
        this.logger.info(
          `Enviando para retry: ${event.id} (${nextRetryCount}/${options.retryAttempts})`,
        );

        await this.sendToRetryQueue(event, options, nextRetryCount);
        this.channel.ack(msg);
      } else {
        this.logger.error(
          `Max retries atingido para ${event.id}, enviando para DLQ`,
        );
        await this.sendToDLQ(event, options, retryCount);
        this.channel.ack(msg);
      }
    }
  }

  private async handleRetryMessage(
    msg: ConsumeMessage,
    options: Required<ConsumerOptions>,
  ): Promise<void> {
    if (!this.channel) return;

    try {
      const event = this.parseEvent(msg);
      const retryCount = this.getRetryCount(msg);
      const routingKey =
        msg.properties.headers?.['x-original-routing-key'] ||
        options.routingKey;

      this.logger.info(`Retry event ${event.id} (attempt ${retryCount})`);

      // Re-enviar para fila principal
      this.channel.publish(
        options.exchange,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          headers: {
            'x-retry-count': retryCount,
            'x-original-routing-key': routingKey,
          },
        },
      );

      this.channel.ack(msg);
    } catch (error) {
      this.logger.error('Erro ao processar retry:', error);
      this.channel.nack(msg, false, false);
    }
  }

  private async handleDLQMessage(
    msg: ConsumeMessage,
    consumer: ConsumerRegistration,
  ): Promise<void> {
    if (!this.channel) return;

    try {
      const event = this.parseEvent(msg);
      this.logger.info(
        `[DEBUG] DLQ message received: ${event.type} (${event.id})`,
      );
      this.logger.info(
        `[DEBUG] DLQ Event data: ${JSON.stringify((event as any).data, null, 2)}`,
      );

      // Se há um DLQ handler configurado, use-o para processar a mensagem
      if (consumer.dlqHandler) {
        this.logger.info(
          `Processing DLQ message with cancel handler: ${event.id}`,
        );
        await consumer.dlqHandler.handle(event);
        this.logger.info(`Movement ${event.id} cancelled successfully via DLQ`);
      } else {
        // Fallback: apenas log da mensagem na DLQ
        this.logger.error(
          `Message ${event.id} sent to DLQ after max retries. No DLQ handler configured.`,
        );
      }

      this.channel.ack(msg);
    } catch (error) {
      this.logger.error('Erro ao processar mensagem DLQ:', error);
      this.channel.nack(msg, false, false);
    }
  }

  private parseEvent<T extends BaseEvent>(msg: ConsumeMessage): T {
    const content = msg.content.toString();
    const parsedEvent = JSON.parse(content);
    return {
      ...parsedEvent,
      timestamp: new Date(parsedEvent.timestamp),
    } as T;
  }

  private async sendToRetryQueue<T extends BaseEvent>(
    event: T,
    options: Required<ConsumerOptions>,
    retryCount: number,
  ): Promise<void> {
    if (!this.channel) return;

    const queueRetry = `${options.queue}.retry`;

    // Publish to retry queue with custom headers
    this.channel.publish(
      options.exchange,
      queueRetry,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        headers: {
          'x-retry-count': retryCount,
          'x-original-routing-key': options.routingKey,
        },
      },
    );

    this.logger.info(`Evento ${event.id} enviado para retry (${retryCount})`);
  }

  private async sendToDLQ<T extends BaseEvent>(
    event: T,
    options: Required<ConsumerOptions>,
    retryCount: number,
  ): Promise<void> {
    if (!this.channel) return;

    const queueDLQ = `${options.queue}.dlq`;

    this.channel.publish(
      options.exchange,
      queueDLQ,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        headers: {
          'x-original-routing-key': options.routingKey,
          'x-failed-at': new Date().toISOString(),
          'x-final-retry-count': retryCount,
        },
      },
    );

    this.logger.info(
      `Evento ${event.id} enviado para DLQ após ${retryCount} retries`,
    );
  }

  private getRetryCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers || {};

    // Usar header customizado se disponível
    if (typeof headers['x-retry-count'] === 'number') {
      return headers['x-retry-count'];
    }

    // Contar retries do x-death header
    const xDeath = headers['x-death'];
    if (Array.isArray(xDeath)) {
      return xDeath.reduce((total, death) => total + (death.count || 0), 0);
    }

    return 0;
  }

  async stop(): Promise<void> {
    if (!this.isStarted) return;

    // Cancel all consumers
    for (const [, consumer] of this.consumers) {
      if (this.channel) {
        // Cancel main consumer
        if (consumer.consumerTag) {
          try {
            await this.channel.cancel(consumer.consumerTag);
            this.logger.info(`Stopped main consumer for ${consumer.eventType}`);
          } catch (error) {
            this.logger.error(
              `Error stopping main consumer for ${consumer.eventType}:`,
              error,
            );
          }
        }

        // Cancel retry consumer
        if (consumer.retryConsumerTag) {
          try {
            await this.channel.cancel(consumer.retryConsumerTag);
            this.logger.info(
              `Stopped retry consumer for ${consumer.eventType}`,
            );
          } catch (error) {
            this.logger.error(
              `Error stopping retry consumer for ${consumer.eventType}:`,
              error,
            );
          }
        }

        // Cancel DLQ consumer
        if (consumer.dlqConsumerTag) {
          try {
            await this.channel.cancel(consumer.dlqConsumerTag);
            this.logger.info(`Stopped DLQ consumer for ${consumer.eventType}`);
          } catch (error) {
            this.logger.error(
              `Error stopping DLQ consumer for ${consumer.eventType}:`,
              error,
            );
          }
        }
      }
    }

    // Close channel
    if (this.channel) {
      try {
        await this.channel.close();
      } catch (error) {
        this.logger.error('Error closing consumer channel:', error);
      }
      this.channel = null;
    }

    this.isStarted = false;
    this.logger.info('Event consumer stopped');
  }
}
