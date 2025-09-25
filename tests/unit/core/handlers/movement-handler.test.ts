import { MovementEvent, MovementEventType } from '@/core/events/movement-event';
import { MovementCreatedHandler } from '@/core/handlers/movement-created-handler';
import { ICompleteMovementUseCase } from '@/core/usecases/movements/complete-movement-usecase';
import { ServerError } from '@/domain/errors/server.error';
import { MovementStatus, MovementType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('MovementCreatedHandler', () => {
  let handler: MovementCreatedHandler;
  let mockCompleteMovementUseCase: ICompleteMovementUseCase;

  beforeEach(() => {
    mockCompleteMovementUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    };
    handler = new MovementCreatedHandler(mockCompleteMovementUseCase);
  });

  describe('handle', () => {
    it('should process a valid movement event', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const event: MovementEvent = {
        id: 'event-id',
        type: MovementEventType.CREATED,
        version: '1.0',
        timestamp: new Date(),
        data: {
          id: movementId,
          accountId: 'account-id',
          amount: 100,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          createdAt: new Date(),
        },
      };

      await handler.handle(event);

      expect(mockCompleteMovementUseCase.execute).toHaveBeenCalledWith({
        movementId,
      });
    });

    it('should throw ServerError for invalid UUID in event data', async () => {
      const event: MovementEvent = {
        id: 'event-id',
        type: MovementEventType.CREATED,
        version: '1.0',
        timestamp: new Date(),
        data: {
          id: 'invalid-uuid',
          accountId: 'account-id',
          amount: 100,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          createdAt: new Date(),
        },
      };

      await expect(handler.handle(event)).rejects.toThrow(ServerError);
      expect(mockCompleteMovementUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ServerError for missing id in event data', async () => {
      const event: MovementEvent = {
        id: 'event-id',
        type: MovementEventType.CREATED,
        version: '1.0',
        timestamp: new Date(),
        data: {} as any,
      };

      await expect(handler.handle(event)).rejects.toThrow(ServerError);
      expect(mockCompleteMovementUseCase.execute).not.toHaveBeenCalled();
    });

    it('should throw ServerError when completeMovementUseCase fails', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const event: MovementEvent = {
        id: 'event-id',
        type: MovementEventType.CREATED,
        version: '1.0',
        timestamp: new Date(),
        data: {
          id: movementId,
          accountId: 'account-id',
          amount: 100,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          createdAt: new Date(),
        },
      };

      const useCaseError = new Error('Use case failed');
      vi.mocked(mockCompleteMovementUseCase.execute).mockRejectedValueOnce(
        useCaseError,
      );

      await expect(handler.handle(event)).rejects.toThrow(ServerError);
    });

    it('should handle different movement event types', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const event: MovementEvent = {
        id: 'event-id',
        type: MovementEventType.UPDATED,
        timestamp: new Date(),
        version: '1.0',
        data: {
          id: movementId,
          accountId: 'account-id',
          amount: 100,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          createdAt: new Date(),
        },
      };

      await handler.handle(event);

      expect(mockCompleteMovementUseCase.execute).toHaveBeenCalledWith({
        movementId,
      });
    });

    it('should log processing message', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const event: MovementEvent = {
        id: 'event-id',
        version: '1.0',
        type: MovementEventType.CREATED,
        timestamp: new Date(),
        data: {
          id: movementId,
          accountId: 'account-id',
          amount: 100,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          createdAt: new Date(),
        },
      };

      await handler.handle(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Processing movement: ${movementId}`,
      );
      consoleSpy.mockRestore();
    });
  });
});
