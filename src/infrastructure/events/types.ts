export type EventType = string;

export type BaseEvent<T = EventType> = {
  id: string;
  type: T;
  timestamp: Date;
  version: string;
  correlationId?: string;
};

export interface IEventManager {
  publish<T extends BaseEvent>(event: T): Promise<void>;
  publishBatch<T extends BaseEvent>(events: T[]): Promise<void>;
  subscribe<T extends BaseEvent>(
    eventType: EventType,
    handler: IEventHandler<T>,
    options?: ConsumerOptions,
  ): Promise<void>;
  startConsumer(): Promise<void>;
  stopConsumer(): Promise<void>;
}

export interface IEventHandler<T extends BaseEvent = BaseEvent> {
  handle(event: T): Promise<void>;
}

export interface IEventPublisher {
  publish<T extends BaseEvent>(event: T): Promise<void>;
  publishBatch<T extends BaseEvent>(events: T[]): Promise<void>;
}

export interface IEventConsumer {
  subscribe<T extends BaseEvent>(
    eventType: EventType,
    handler: IEventHandler<T>,
    options?: ConsumerOptions,
  ): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type ConsumerOptions = {
  queue?: string;
  exchange?: string;
  routingKey?: string;
  prefetch?: number;
  retryAttempts?: number;
  retryDelay?: number;
  deadLetterExchange?: string;
};

export type ConnectionOptions = {
  url: string;
  exchange?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeat?: number;
};

export type EventManagerOptions = {
  connection: ConnectionOptions;
  defaultExchange?: string;
  defaultQueue?: string;
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
};
