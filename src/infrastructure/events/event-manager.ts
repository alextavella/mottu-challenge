import { RabbitMQConnection } from './connection';
import { RabbitMQEventConsumer } from './consumer';
import { RabbitMQEventPublisher } from './publisher';
import {
  BaseEvent,
  ConsumerOptions,
  EventHandler,
  EventManagerOptions,
  EventType,
} from './types';

export class EventManager {
  private connection: RabbitMQConnection;
  private publisher: RabbitMQEventPublisher;
  private consumer: RabbitMQEventConsumer;
  private isInitialized = false;

  constructor(private options: EventManagerOptions) {
    this.connection = new RabbitMQConnection(options.connection);
    this.publisher = new RabbitMQEventPublisher(
      this.connection,
      options.defaultExchange,
    );
    this.consumer = new RabbitMQEventConsumer(
      this.connection,
      options.defaultExchange,
    );
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.connection.connect();
      console.log('Event Manager initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Event Manager:', error);
      throw error;
    }
  }

  async publish<T extends BaseEvent>(event: T): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.publisher.publish(event);
  }

  async publishBatch<T extends BaseEvent>(events: T[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.publisher.publishBatch(events);
  }

  async subscribe<T extends BaseEvent>(
    eventType: EventType,
    handler: EventHandler<T>,
    options?: ConsumerOptions,
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Apply default retry options if enabled
    const consumerOptions: ConsumerOptions = {
      retryAttempts: this.options.retryAttempts || 3,
      retryDelay: this.options.retryDelay || 1000,
      ...options,
    };

    if (!this.options.enableRetry) {
      consumerOptions.retryAttempts = 0;
    }

    await this.consumer.subscribe(eventType, handler, consumerOptions);
  }

  async startConsumer(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.consumer.start();
  }

  async stopConsumer(): Promise<void> {
    await this.consumer.stop();
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Event Manager...');

    try {
      await this.consumer.stop();
      await this.publisher.close();
      await this.connection.close();

      this.isInitialized = false;
      console.log('Event Manager shutdown completed');
    } catch (error) {
      console.error('Error during Event Manager shutdown:', error);
    }
  }

  isConnected(): boolean {
    return this.connection.isConnected();
  }
}

// Singleton instance
let eventManagerInstance: EventManager | null = null;

export function getEventManager(): EventManager {
  if (!eventManagerInstance) {
    // Use default options or get from environment
    eventManagerInstance = new EventManager({
      connection: {
        url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
        exchange: process.env.RABBITMQ_EXCHANGE || 'events',
        heartbeat: parseInt(process.env.RABBITMQ_HEARTBEAT || '60'),
        reconnectAttempts: parseInt(
          process.env.RABBITMQ_RECONNECT_ATTEMPTS || '5',
        ),
        reconnectDelay: parseInt(
          process.env.RABBITMQ_RECONNECT_DELAY || '5000',
        ),
      },
      events: {
        enableRetry: process.env.EVENTS_ENABLE_RETRY === 'true',
        retryAttempts: parseInt(process.env.EVENTS_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.EVENTS_RETRY_DELAY || '1000'),
      },
    });
  }
  return eventManagerInstance;
}

export async function shutdownEventManager(): Promise<void> {
  if (eventManagerInstance) {
    await eventManagerInstance.shutdown();
    eventManagerInstance = null;
  }
}
