import { AccountEventType } from '../../message/events/account-event';
import { MovementEventType } from '../../message/events/movement-event';

export type EventType = AccountEventType | MovementEventType;

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  version: string;
  correlationId?: string;
}

export interface EventHandler<T extends BaseEvent = BaseEvent> {
  handle(event: T): Promise<void>;
}

export interface EventPublisher {
  publish<T extends BaseEvent>(event: T): Promise<void>;
  publishBatch<T extends BaseEvent>(events: T[]): Promise<void>;
}

export interface EventConsumer {
  subscribe<T extends BaseEvent>(
    eventType: EventType,
    handler: EventHandler<T>,
    options?: ConsumerOptions,
  ): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface ConsumerOptions {
  queue?: string;
  exchange?: string;
  routingKey?: string;
  prefetch?: number;
  retryAttempts?: number;
  retryDelay?: number;
  deadLetterExchange?: string;
}

export interface ConnectionOptions {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeat?: number;
}

export interface EventManagerOptions {
  connection: ConnectionOptions;
  defaultExchange?: string;
  defaultQueue?: string;
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}
