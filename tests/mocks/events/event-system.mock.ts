import type { RabbitMQConnection } from '@/lib/events/connection';
import type { RabbitMQEventConsumer } from '@/lib/events/consumer';
import type { RabbitMQEventPublisher } from '@/lib/events/publisher';
import type { BaseEvent, EventHandler } from '@/lib/events/types';
import type { Mocked } from 'vitest';

/**
 * Mock do RabbitMQConnection
 */
export const createRabbitMQConnectionMock = (): Mocked<RabbitMQConnection> => ({
  connect: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  createChannel: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
}) as any;

/**
 * Mock do RabbitMQEventPublisher
 */
export const createRabbitMQEventPublisherMock = (): Mocked<RabbitMQEventPublisher> => ({
  publish: vi.fn().mockResolvedValue(undefined),
  publishBatch: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
}) as any;

/**
 * Mock do RabbitMQEventConsumer
 */
export const createRabbitMQEventConsumerMock = (): Mocked<RabbitMQEventConsumer> => ({
  subscribe: vi.fn().mockResolvedValue(undefined),
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
}) as any;

/**
 * Mock de um EventHandler genérico
 */
export const createEventHandlerMock = <T extends BaseEvent>(): EventHandler<T> => ({
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
