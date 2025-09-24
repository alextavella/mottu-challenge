import { RabbitMQConnection } from '@/infra/events/connection';
import { RabbitMQEventConsumer } from '@/infra/events/consumer';
import { RabbitMQEventPublisher } from '@/infra/events/publisher';
import { BaseEvent, IEventHandler, IEventManager } from '@/infra/events/types';
import { vi, type Mocked } from 'vitest';

/**
 * Mock do IEventManager para uso em testes unitários
 */
export const createEventManagerMock = (): IEventManager =>
  ({
    publish: vi.fn().mockResolvedValue(undefined),
    publishBatch: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    startConsumer: vi.fn().mockResolvedValue(undefined),
  }) as any;

/**
 * Mock do RabbitMQConnection
 */
export const createRabbitMQConnectionMock = (): Mocked<RabbitMQConnection> =>
  ({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createChannel: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
  }) as any;

/**
 * Mock do RabbitMQEventPublisher
 */
export const createRabbitMQEventPublisherMock =
  (): Mocked<RabbitMQEventPublisher> =>
    ({
      publish: vi.fn().mockResolvedValue(undefined),
      publishBatch: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }) as any;

/**
 * Mock do RabbitMQEventConsumer
 */
export const createRabbitMQEventConsumerMock =
  (): Mocked<RabbitMQEventConsumer> =>
    ({
      subscribe: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    }) as any;

/**
 * Mock de um EventHandler genérico
 */
export const createEventHandlerMock = <
  T extends BaseEvent,
>(): IEventHandler<T> => ({
  handle: vi.fn(),
});

/**
 * Configuração completa de mocks para o sistema de eventos
 */
export const createEventSystemMocks = () => {
  const mockConnection = createRabbitMQConnectionMock();
  const mockPublisher = createRabbitMQEventPublisherMock();
  const mockConsumer = createRabbitMQEventConsumerMock();
  const mockHandler = createEventHandlerMock();

  return {
    mockConnection,
    mockPublisher,
    mockConsumer,
    mockHandler,
  };
};
