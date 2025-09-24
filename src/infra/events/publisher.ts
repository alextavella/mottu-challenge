import { Channel } from 'amqplib';
import { RabbitMQConnection } from './connection';
import { BaseEvent, IEventPublisher } from './types';

export class RabbitMQEventPublisher implements IEventPublisher {
  private channel: Channel | null = null;
  private readonly exchangeName: string;

  constructor(
    private connection: RabbitMQConnection,
    exchangeName = 'events',
  ) {
    this.exchangeName = exchangeName;
  }

  private async ensureChannel(): Promise<Channel> {
    if (!this.channel) {
      this.channel = await this.connection.createChannel('publisher');

      // Declare the exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });
    }
    return this.channel;
  }

  async publish<T extends BaseEvent>(event: T): Promise<void> {
    const channel = await this.ensureChannel();

    const routingKey = this.getRoutingKey(event);
    const message = Buffer.from(
      JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString(),
      }),
    );

    const options = {
      persistent: true,
      messageId: event.id,
      timestamp: event.timestamp.getTime(),
      type: event.type,
      correlationId: event.correlationId,
      headers: {
        version: event.version,
      },
    };

    try {
      const published = channel.publish(
        this.exchangeName,
        routingKey,
        message,
        options,
      );

      if (!published) {
        throw new Error('Failed to publish event: channel buffer full');
      }

      console.log(`Event published: ${event.type} with ID ${event.id}`);
    } catch (error) {
      console.error(`Failed to publish event ${event.id}:`, error);
      throw error;
    }
  }

  async publishBatch<T extends BaseEvent>(events: T[]): Promise<void> {
    if (events.length === 0) return;

    const channel = await this.ensureChannel();

    try {
      // Publish all events in sequence for batch operation
      for (const event of events) {
        const routingKey = this.getRoutingKey(event);
        const message = Buffer.from(
          JSON.stringify({
            ...event,
            timestamp: event.timestamp.toISOString(),
          }),
        );

        const options = {
          persistent: true,
          messageId: event.id,
          timestamp: event.timestamp.getTime(),
          type: event.type,
          correlationId: event.correlationId,
          headers: {
            version: event.version,
          },
        };

        const published = channel.publish(
          this.exchangeName,
          routingKey,
          message,
          options,
        );
        if (!published) {
          throw new Error(
            `Failed to publish event ${event.id}: channel buffer full`,
          );
        }
      }

      console.log(`Batch published: ${events.length} events`);
    } catch (error) {
      console.error(
        `Failed to publish batch of ${events.length} events:`,
        error,
      );
      throw error;
    }
  }

  private getRoutingKey(event: BaseEvent): string {
    // Convert event type to routing key format
    // e.g., 'movement.created' -> 'movement.created'
    // e.g., 'account.balance_updated' -> 'account.balance_updated'
    return event.type;
  }

  async close(): Promise<void> {
    if (this.channel) {
      try {
        await this.channel.close();
      } catch (error) {
        console.error('Error closing publisher channel:', error);
      }
      this.channel = null;
    }
  }
}
