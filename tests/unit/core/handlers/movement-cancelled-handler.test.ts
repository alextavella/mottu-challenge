import { MovementEvent, MovementEventType } from '@/core/events/movement-event';
import { MovementCancelledHandler } from '@/core/handlers/movement-cancelled-handler';
import { ICancelMovementUseCase } from '@/core/usecases/movements/cancel-movement-usecase';
import { ServerError } from '@/domain/errors/server.error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('MovementCancelledHandler', () => {
  let movementCancelledHandler: MovementCancelledHandler;
  let mockCancelMovementUseCase: ICancelMovementUseCase;

  const mockMovementEvent: MovementEvent = {
    id: 'event-123',
    version: '1.0',
    type: MovementEventType.UPDATED,
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      accountId: '123e4567-e89b-12d3-a456-426614174001',
      amount: 100.5,
      type: 'CREDIT',
      description: 'Test movement',
      status: 'CANCELLED',
      createdAt: new Date('2023-01-01T00:00:00Z'),
    },
    timestamp: new Date('2023-01-01T00:00:00Z'),
    correlationId: 'correlation-123',
  };

  beforeEach(() => {
    mockCancelMovementUseCase = {
      execute: vi.fn(),
    } as any;

    movementCancelledHandler = new MovementCancelledHandler(
      mockCancelMovementUseCase,
    );
  });

  describe('handle', () => {
    it('should handle valid movement event successfully', async () => {
      // Arrange
      vi.mocked(mockCancelMovementUseCase.execute).mockResolvedValue({
        movementId: mockMovementEvent.data.id,
      });

      // Act
      await movementCancelledHandler.handle(mockMovementEvent);

      // Assert
      expect(mockCancelMovementUseCase.execute).toHaveBeenCalledWith({
        movementId: mockMovementEvent.data.id,
      });
    });

    it('should handle different movement IDs', async () => {
      // Arrange
      const testCases = [
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-9f12-345678901234',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ];

      for (const movementId of testCases) {
        // Reset mocks
        vi.clearAllMocks();

        const event: MovementEvent = {
          ...mockMovementEvent,
          data: {
            ...mockMovementEvent.data,
            id: movementId,
          },
        };

        vi.mocked(mockCancelMovementUseCase.execute).mockResolvedValue({
          movementId,
        });

        // Act
        await movementCancelledHandler.handle(event);

        // Assert
        expect(mockCancelMovementUseCase.execute).toHaveBeenCalledWith({
          movementId,
        });
      }
    });

    it('should handle different event types', async () => {
      // Arrange
      const eventTypes = [
        MovementEventType.CREATED,
        MovementEventType.UPDATED,
        MovementEventType.DELETED,
      ];

      for (const eventType of eventTypes) {
        // Reset mocks
        vi.clearAllMocks();

        const event: MovementEvent = {
          ...mockMovementEvent,
          type: eventType,
        };

        vi.mocked(mockCancelMovementUseCase.execute).mockResolvedValue({
          movementId: mockMovementEvent.data.id,
        });

        // Act
        await movementCancelledHandler.handle(event);

        // Assert
        expect(mockCancelMovementUseCase.execute).toHaveBeenCalledWith({
          movementId: mockMovementEvent.data.id,
        });
      }
    });

    it('should handle events with different timestamps', async () => {
      // Arrange
      const timestamps = [
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-06-15T12:30:45Z'),
        new Date('2023-12-31T23:59:59Z'),
        new Date(),
      ];

      for (const timestamp of timestamps) {
        // Reset mocks
        vi.clearAllMocks();

        const event: MovementEvent = {
          ...mockMovementEvent,
          timestamp,
        };

        vi.mocked(mockCancelMovementUseCase.execute).mockResolvedValue({
          movementId: mockMovementEvent.data.id,
        });

        // Act
        await movementCancelledHandler.handle(event);

        // Assert
        expect(mockCancelMovementUseCase.execute).toHaveBeenCalledWith({
          movementId: mockMovementEvent.data.id,
        });
      }
    });

    it('should handle events with correlation IDs', async () => {
      // Arrange
      const correlationIds = [
        'correlation-123',
        'correlation-456',
        'correlation-789',
        undefined,
      ];

      for (const correlationId of correlationIds) {
        // Reset mocks
        vi.clearAllMocks();

        const event: MovementEvent = {
          ...mockMovementEvent,
          correlationId,
        };

        vi.mocked(mockCancelMovementUseCase.execute).mockResolvedValue({
          movementId: mockMovementEvent.data.id,
        });

        // Act
        await movementCancelledHandler.handle(event);

        // Assert
        expect(mockCancelMovementUseCase.execute).toHaveBeenCalledWith({
          movementId: mockMovementEvent.data.id,
        });
      }
    });

    it('should throw ServerError for invalid UUID in movement data', async () => {
      // Arrange
      const invalidEvent: MovementEvent = {
        ...mockMovementEvent,
        data: {
          ...mockMovementEvent.data,
          id: 'invalid-uuid',
        },
      };

      // Act & Assert
      await expect(
        movementCancelledHandler.handle(invalidEvent),
      ).rejects.toThrow(ServerError);

      expect(mockCancelMovementUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ServerError for missing movement ID', async () => {
      // Arrange
      const invalidEvent: MovementEvent = {
        ...mockMovementEvent,
        data: {
          ...mockMovementEvent.data,
          id: undefined as any,
        },
      };

      // Act & Assert
      await expect(
        movementCancelledHandler.handle(invalidEvent),
      ).rejects.toThrow(ServerError);

      expect(mockCancelMovementUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ServerError for empty movement ID', async () => {
      // Arrange
      const invalidEvent: MovementEvent = {
        ...mockMovementEvent,
        data: {
          ...mockMovementEvent.data,
          id: '',
        },
      };

      // Act & Assert
      await expect(
        movementCancelledHandler.handle(invalidEvent),
      ).rejects.toThrow(ServerError);

      expect(mockCancelMovementUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ServerError for non-string movement ID', async () => {
      // Arrange
      const invalidEvent: MovementEvent = {
        ...mockMovementEvent,
        data: {
          ...mockMovementEvent.data,
          id: 123 as any,
        },
      };

      // Act & Assert
      await expect(
        movementCancelledHandler.handle(invalidEvent),
      ).rejects.toThrow(ServerError);

      expect(mockCancelMovementUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ServerError when usecase throws error', async () => {
      // Arrange
      const usecaseError = new Error('UseCase failed');
      vi.mocked(mockCancelMovementUseCase.execute).mockRejectedValue(
        usecaseError,
      );

      // Act & Assert
      await expect(
        movementCancelledHandler.handle(mockMovementEvent),
      ).rejects.toThrow(ServerError);

      expect(mockCancelMovementUseCase.execute).toHaveBeenCalledWith({
        movementId: mockMovementEvent.data.id,
      });
    });

    it('should include correct error message when usecase fails', async () => {
      // Arrange
      const usecaseError = new Error('UseCase failed');
      vi.mocked(mockCancelMovementUseCase.execute).mockRejectedValue(
        usecaseError,
      );

      // Act & Assert
      await expect(
        movementCancelledHandler.handle(mockMovementEvent),
      ).rejects.toThrow(
        new ServerError(
          `Failed to cancel movement ${mockMovementEvent.data.id}`,
          usecaseError,
        ),
      );
    });

    it('should handle different movement data structures', async () => {
      // Arrange
      const testCases = [
        {
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            accountId: '123e4567-e89b-12d3-a456-426614174001',
            amount: 100.5,
            type: 'CREDIT',
            description: 'Test movement',
            status: 'PENDING',
            createdAt: new Date('2023-01-01T00:00:00Z'),
          },
          description: 'complete movement data',
        },
        {
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            accountId: '123e4567-e89b-12d3-a456-426614174001',
            amount: 200.75,
            type: 'DEBIT',
            status: 'COMPLETED',
            createdAt: new Date('2023-01-01T00:00:00Z'),
          },
          description: 'movement data without description',
        },
        {
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            accountId: '123e4567-e89b-12d3-a456-426614174001',
            amount: 0.01,
            type: 'CREDIT',
            description: 'Minimum amount movement',
            status: 'CANCELLED',
            createdAt: new Date('2023-01-01T00:00:00Z'),
          },
          description: 'minimum amount movement',
        },
      ];

      for (const { data, description } of testCases) {
        // Reset mocks
        vi.clearAllMocks();

        const event: MovementEvent = {
          ...mockMovementEvent,
          data,
        };

        vi.mocked(mockCancelMovementUseCase.execute).mockResolvedValue({
          movementId: data.id,
        });

        // Act
        await movementCancelledHandler.handle(event);

        // Assert
        expect(mockCancelMovementUseCase.execute).toHaveBeenCalledWith({
          movementId: data.id,
        });
      }
    });

    it('should handle events with different event IDs', async () => {
      // Arrange
      const eventIds = [
        'event-123',
        'event-456',
        'event-789',
        'event-abc-def-ghi',
      ];

      for (const eventId of eventIds) {
        // Reset mocks
        vi.clearAllMocks();

        const event: MovementEvent = {
          ...mockMovementEvent,
          id: eventId,
        };

        vi.mocked(mockCancelMovementUseCase.execute).mockResolvedValue({
          movementId: mockMovementEvent.data.id,
        });

        // Act
        await movementCancelledHandler.handle(event);

        // Assert
        expect(mockCancelMovementUseCase.execute).toHaveBeenCalledWith({
          movementId: mockMovementEvent.data.id,
        });
      }
    });
  });

  describe('constructor', () => {
    it('should create instance with usecase dependency', () => {
      // Act
      const handler = new MovementCancelledHandler(mockCancelMovementUseCase);

      // Assert
      expect(handler).toBeInstanceOf(MovementCancelledHandler);
    });
  });

  describe('error handling', () => {
    it('should handle validation errors with detailed message', async () => {
      // Arrange
      const invalidEvent: MovementEvent = {
        ...mockMovementEvent,
        data: {
          ...mockMovementEvent.data,
          id: 'invalid-uuid',
        },
      };

      // Act & Assert
      try {
        await movementCancelledHandler.handle(invalidEvent);
        expect.fail('Should have thrown ServerError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServerError);
        expect((error as ServerError).message).toContain(
          'Failed to validate movement',
        );
        expect((error as ServerError).message).toContain(
          'ID deve ser um UUID válido',
        );
      }

      expect(mockCancelMovementUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle usecase errors with movement ID in message', async () => {
      // Arrange
      const usecaseError = new Error('Database connection failed');
      vi.mocked(mockCancelMovementUseCase.execute).mockRejectedValue(
        usecaseError,
      );

      // Act & Assert
      try {
        await movementCancelledHandler.handle(mockMovementEvent);
        expect.fail('Should have thrown ServerError');
      } catch (error) {
        expect(error).toBeInstanceOf(ServerError);
        expect((error as ServerError).message).toContain(
          `Failed to cancel movement ${mockMovementEvent.data.id}`,
        );
        expect((error as ServerError).originalError).toBe(usecaseError);
      }

      expect(mockCancelMovementUseCase.execute).toHaveBeenCalledWith({
        movementId: mockMovementEvent.data.id,
      });
    });
  });
});
