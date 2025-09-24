import { env } from '../config/env.config';
import { ILogger } from '../config/logger';
import { RabbitMQConnection } from './connection';
import { RabbitMQEventConsumer } from './consumer';
import { RabbitMQEventPublisher } from './publisher';
import {
  BaseEvent,
  ConsumerOptions,
  EventManagerOptions,
  EventType,
  IEventHandler,
  IEventManager,
} from './types';

export class EventManager implements IEventManager {
  private connection: RabbitMQConnection;
  private publisher: RabbitMQEventPublisher;
  private consumer: RabbitMQEventConsumer;
  private isInitialized = false;

  constructor(
    private logger: ILogger,
    private options: EventManagerOptions,
  ) {
    this.connection = new RabbitMQConnection(options.connection);
    const exchangeName = options.defaultExchange || 'events';
    this.publisher = new RabbitMQEventPublisher(
      this.logger,
      this.connection,
      exchangeName,
    );
    this.consumer = new RabbitMQEventConsumer(
      this.logger,
      this.connection,
      exchangeName,
    );
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.connection.connect();
      this.logger.info('Event Manager initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize Event Manager:', error);
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
    handler: IEventHandler<T>,
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
    this.logger.info('Shutting down Event Manager...');

    try {
      await this.consumer.stop();
      await this.publisher.close();
      await this.connection.close();

      this.isInitialized = false;
      this.logger.info('Event Manager shutdown completed');
    } catch (error) {
      this.logger.error('Error during Event Manager shutdown:', error);
    }
  }

  isConnected(): boolean {
    return this.connection.isConnected();
  }
}

// Configuration helper function
function createEventManagerOptions(): EventManagerOptions {
  return {
    connection: {
      url: env.RABBITMQ_URL,
      heartbeat: env.RABBITMQ_HEARTBEAT || 60,
      reconnectAttempts: env.RABBITMQ_RECONNECT_ATTEMPTS || 5,
      reconnectDelay: env.RABBITMQ_RECONNECT_DELAY || 5000,
    },
    defaultExchange: env.RABBITMQ_EXCHANGE || 'events',
    enableRetry: env.EVENTS_ENABLE_RETRY,
    retryAttempts: env.EVENTS_RETRY_ATTEMPTS || 3,
    retryDelay: env.EVENTS_RETRY_DELAY || 1000,
  };
}

// Singleton instance
let eventManagerInstance: EventManager | null = null;

export function getEventManager(logger: ILogger): EventManager {
  if (!eventManagerInstance) {
    eventManagerInstance = new EventManager(
      logger,
      createEventManagerOptions(),
    );
  }
  return eventManagerInstance;
}

export async function shutdownEventManager(): Promise<void> {
  if (eventManagerInstance) {
    await eventManagerInstance.shutdown();
    eventManagerInstance = null;
  }
}
