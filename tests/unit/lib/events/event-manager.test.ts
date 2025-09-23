import { RabbitMQConnection } from '@/lib/events/connection';
import { RabbitMQEventConsumer } from '@/lib/events/consumer';
import { EventManager } from '@/lib/events/event-manager';
import { RabbitMQEventPublisher } from '@/lib/events/publisher';
import {
  TestEventType,
  type BaseEvent,
  type EventManagerOptions,
} from '@/lib/events/types';
import { createEventSystemMocks } from 'tests/mocks/events/event-system.mock';
import type { Mocked } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/events/connection');
vi.mock('@/lib/events/publisher');
vi.mock('@/lib/events/consumer');

describe('EventManager', () => {
  let eventManager: EventManager;
  let mockConnection: Mocked<RabbitMQConnection>;
  let mockPublisher: Mocked<RabbitMQEventPublisher>;
  let mockConsumer: Mocked<RabbitMQEventConsumer>;
  let mockHandler: ReturnType<typeof createEventSystemMocks>['mockHandler'];

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mocked instances using centralized mocks
    const mocks = createEventSystemMocks();
    mockConnection = mocks.mockConnection;
    mockPublisher = mocks.mockPublisher;
    mockConsumer = mocks.mockConsumer;
    mockHandler = mocks.mockHandler;

    // Mock the constructors
    vi.mocked(RabbitMQConnection).mockImplementation(() => mockConnection);
    vi.mocked(RabbitMQEventPublisher).mockImplementation(() => mockPublisher);
    vi.mocked(RabbitMQEventConsumer).mockImplementation(() => mockConsumer);

    const options: EventManagerOptions = {
      connection: {
        url: 'amqp://localhost',
      },
      defaultExchange: 'test-exchange',
    };

    eventManager = new EventManager(options);
  });

  describe('publish', () => {
    it('should publish a single event', async () => {
      const event: BaseEvent = {
        id: 'event-1',
        type: TestEventType.TEST_EVENT,
        version: '1.0.0',
        timestamp: new Date(),
        correlationId: 'corr-1',
      };

      vi.mocked(mockPublisher.publish).mockResolvedValue();

      await eventManager.publish(event);

      expect(mockPublisher.publish).toHaveBeenCalledWith(event);
    });

    it('should handle publish errors', async () => {
      const event: BaseEvent = {
        id: 'event-1',
        type: TestEventType.TEST_EVENT,
        version: '1.0.0',
        timestamp: new Date(),
      };

      const publishError = new Error('Publish failed');
      vi.mocked(mockPublisher.publish).mockRejectedValue(publishError);

      await expect(eventManager.publish(event)).rejects.toThrow(
        'Publish failed',
      );
    });
  });

  describe('publishBatch', () => {
    it('should publish multiple events', async () => {
      const events: BaseEvent[] = [
        {
          id: 'event-1',
          type: TestEventType.TEST_EVENT,
          version: '1.0.0',
          timestamp: new Date(),
        },
        {
          id: 'event-2',
          type: TestEventType.TEST_EVENT,
          version: '1.0.0',
          timestamp: new Date(),
        },
      ];

      vi.mocked(mockPublisher.publishBatch).mockResolvedValue();

      await eventManager.publishBatch(events);

      expect(mockPublisher.publishBatch).toHaveBeenCalledWith(events);
    });

    it('should handle empty batch', async () => {
      const events: BaseEvent[] = [];

      vi.mocked(mockPublisher.publishBatch).mockResolvedValue();

      await eventManager.publishBatch(events);

      expect(mockPublisher.publishBatch).toHaveBeenCalledWith(events);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to events with handler', async () => {
      const eventType = TestEventType.TEST_EVENT;
      const options = { queue: 'test-queue' };

      vi.mocked(mockConsumer.subscribe).mockResolvedValue();

      await eventManager.subscribe(eventType, mockHandler, options);

      expect(mockConsumer.subscribe).toHaveBeenCalledWith(
        eventType,
        mockHandler,
        expect.objectContaining(options),
      );
    });

    it('should subscribe without options', async () => {
      const eventType = TestEventType.TEST_EVENT;

      vi.mocked(mockConsumer.subscribe).mockResolvedValue();

      await eventManager.subscribe(eventType, mockHandler);

      expect(mockConsumer.subscribe).toHaveBeenCalledWith(
        eventType,
        mockHandler,
        expect.any(Object),
      );
    });
  });

  describe('startConsumer', () => {
    it('should start the consumer', async () => {
      vi.mocked(mockConsumer.start).mockResolvedValue();

      await eventManager.startConsumer();

      expect(mockConsumer.start).toHaveBeenCalled();
    });

    it('should handle consumer start errors', async () => {
      const startError = new Error('Consumer start failed');
      vi.mocked(mockConsumer.start).mockRejectedValue(startError);

      await expect(eventManager.startConsumer()).rejects.toThrow(
        'Consumer start failed',
      );
    });
  });

  describe('stopConsumer', () => {
    it('should stop the consumer', async () => {
      vi.mocked(mockConsumer.stop).mockResolvedValue();

      await eventManager.stopConsumer();

      expect(mockConsumer.stop).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should shutdown publisher and consumer', async () => {
      await eventManager.shutdown();

      expect(mockConsumer.stop).toHaveBeenCalled();
      expect(mockPublisher.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle shutdown errors gracefully', async () => {
      const consumerError = new Error('Consumer stop failed');
      const publisherError = new Error('Publisher close failed');

      mockConsumer.stop.mockRejectedValue(consumerError);
      mockPublisher.close.mockRejectedValue(publisherError);

      // Should not throw, but log errors internally
      await expect(eventManager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('integration', () => {
    it('should handle complete workflow', async () => {
      const event: BaseEvent = {
        id: 'workflow-event',
        type: TestEventType.TEST_EVENT,
        version: '1.0.0',
        timestamp: new Date(),
      };

      // Setup mocks
      vi.mocked(mockPublisher.publish).mockResolvedValue();
      vi.mocked(mockConsumer.subscribe).mockResolvedValue();
      vi.mocked(mockConsumer.start).mockResolvedValue();
      vi.mocked(mockConsumer.stop).mockResolvedValue();

      // Execute workflow
      await eventManager.subscribe(TestEventType.TEST_EVENT, mockHandler);
      await eventManager.startConsumer();
      await eventManager.publish(event);
      await eventManager.stopConsumer();

      // Verify calls
      expect(mockConsumer.subscribe).toHaveBeenCalledWith(
        TestEventType.TEST_EVENT,
        mockHandler,
        expect.any(Object),
      );
      expect(mockConsumer.start).toHaveBeenCalled();
      expect(mockPublisher.publish).toHaveBeenCalledWith(event);
      expect(mockConsumer.stop).toHaveBeenCalled();
    });
  });
});
