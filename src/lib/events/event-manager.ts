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
