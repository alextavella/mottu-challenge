import {
  CancelMovementUseCase,
  ICancelMovementUseCase,
} from '@/core/usecases/movements/cancel-movement-usecase';
import { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';
import {
  MovementData,
  MovementStatus,
} from '@/domain/entities/movement.entity';
import { MovementNotFoundError } from '@/domain/errors/movement.errors';
import { IEventManager } from '@/infra/events/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CancelMovementUseCase', () => {
  let cancelMovementUseCase: ICancelMovementUseCase;
  let mockMovementRepository: IMovementRepository;
  let mockEventManager: IEventManager;

  const mockMovement: MovementData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    accountId: '123e4567-e89b-12d3-a456-426614174001',
    amount: 100.5,
    type: 'CREDIT',
    description: 'Test movement',
    status: MovementStatus.PENDING,
    createdAt: new Date('2023-01-01T00:00:00Z'),
  };

  const mockUpdatedMovement: MovementData = {
    ...mockMovement,
    status: MovementStatus.CANCELLED,
  };

  beforeEach(() => {
    mockMovementRepository = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
      create: vi.fn(),
      findByAccountId: vi.fn(),
    } as any;

    mockEventManager = {
      publish: vi.fn(),
      subscribe: vi.fn(),
      startConsumer: vi.fn(),
      stopConsumer: vi.fn(),
      shutdown: vi.fn(),
      initialize: vi.fn(),
    } as any;

    cancelMovementUseCase = new CancelMovementUseCase(
      mockMovementRepository,
      mockEventManager,
    );
  });

  describe('execute', () => {
    it('should cancel movement successfully', async () => {
      // Arrange
      const input = { movementId: mockMovement.id };
      vi.mocked(mockMovementRepository.findById).mockResolvedValue(
        mockMovement,
      );
      vi.mocked(mockMovementRepository.updateStatus).mockResolvedValue(
        mockUpdatedMovement,
      );
      vi.mocked(mockEventManager.publish).mockResolvedValue();

      // Act
      const result = await cancelMovementUseCase.execute(input);

      // Assert
      expect(result).toEqual({
        movementId: mockMovement.id,
      });

      expect(mockMovementRepository.findById).toHaveBeenCalledWith(
        mockMovement.id,
      );
      expect(mockMovementRepository.updateStatus).toHaveBeenCalledWith(
        mockMovement.id,
        MovementStatus.CANCELLED,
      );
      expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
    });

    it('should throw MovementNotFoundError when movement does not exist', async () => {
      // Arrange
      const input = { movementId: 'non-existent-id' };
      vi.mocked(mockMovementRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(cancelMovementUseCase.execute(input)).rejects.toThrow(
        MovementNotFoundError,
      );

      expect(mockMovementRepository.findById).toHaveBeenCalledWith(
        'non-existent-id',
      );
      expect(mockMovementRepository.updateStatus).not.toHaveBeenCalled();
      expect(mockEventManager.publish).not.toHaveBeenCalled();
    });

    it('should throw MovementNotFoundError when repository throws error', async () => {
      // Arrange
      const input = { movementId: mockMovement.id };
      const repositoryError = new Error('Database connection failed');
      vi.mocked(mockMovementRepository.findById).mockRejectedValue(
        repositoryError,
      );

      // Act & Assert
      await expect(cancelMovementUseCase.execute(input)).rejects.toThrow(
        MovementNotFoundError,
      );

      expect(mockMovementRepository.findById).toHaveBeenCalledWith(
        mockMovement.id,
      );
      expect(mockMovementRepository.updateStatus).not.toHaveBeenCalled();
      expect(mockEventManager.publish).not.toHaveBeenCalled();
    });

    it('should handle different movement statuses before cancellation', async () => {
      // Arrange
      const pendingMovement: MovementData = {
        ...mockMovement,
        status: MovementStatus.PENDING,
      };

      const completedMovement: MovementData = {
        ...mockMovement,
        status: MovementStatus.COMPLETED,
      };

      const cancelledMovement: MovementData = {
        ...mockMovement,
        status: MovementStatus.CANCELLED,
      };

      const testCases = [
        { movement: pendingMovement, description: 'pending movement' },
        { movement: completedMovement, description: 'completed movement' },
        {
          movement: cancelledMovement,
          description: 'already cancelled movement',
        },
      ];

      for (const { movement, description } of testCases) {
        // Reset mocks
        vi.clearAllMocks();

        const input = { movementId: movement.id };
        vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
        vi.mocked(mockMovementRepository.updateStatus).mockResolvedValue({
          ...movement,
          status: MovementStatus.CANCELLED,
        });
        vi.mocked(mockEventManager.publish).mockResolvedValue();

        // Act
        const result = await cancelMovementUseCase.execute(input);

        // Assert
        expect(result).toEqual({
          movementId: movement.id,
        });

        expect(mockMovementRepository.findById).toHaveBeenCalledWith(
          movement.id,
        );
        expect(mockMovementRepository.updateStatus).toHaveBeenCalledWith(
          movement.id,
          MovementStatus.CANCELLED,
        );
        expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
      }
    });

    it('should handle different movement types', async () => {
      // Arrange
      const creditMovement: MovementData = {
        ...mockMovement,
        type: 'CREDIT',
      };

      const debitMovement: MovementData = {
        ...mockMovement,
        type: 'DEBIT',
      };

      const testCases = [
        { movement: creditMovement, description: 'credit movement' },
        { movement: debitMovement, description: 'debit movement' },
      ];

      for (const { movement, description } of testCases) {
        // Reset mocks
        vi.clearAllMocks();

        const input = { movementId: movement.id };
        vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
        vi.mocked(mockMovementRepository.updateStatus).mockResolvedValue({
          ...movement,
          status: MovementStatus.CANCELLED,
        });
        vi.mocked(mockEventManager.publish).mockResolvedValue();

        // Act
        const result = await cancelMovementUseCase.execute(input);

        // Assert
        expect(result).toEqual({
          movementId: movement.id,
        });

        expect(mockMovementRepository.findById).toHaveBeenCalledWith(
          movement.id,
        );
        expect(mockMovementRepository.updateStatus).toHaveBeenCalledWith(
          movement.id,
          MovementStatus.CANCELLED,
        );
        expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
      }
    });

    it('should handle different movement amounts', async () => {
      // Arrange
      const testCases = [
        { amount: 0.01, description: 'minimum amount' },
        { amount: 100.5, description: 'decimal amount' },
        { amount: 1000, description: 'integer amount' },
        { amount: 999999.99, description: 'large amount' },
      ];

      for (const { amount, description } of testCases) {
        // Reset mocks
        vi.clearAllMocks();

        const movement: MovementData = {
          ...mockMovement,
          amount,
        };

        const input = { movementId: movement.id };
        vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
        vi.mocked(mockMovementRepository.updateStatus).mockResolvedValue({
          ...movement,
          status: MovementStatus.CANCELLED,
        });
        vi.mocked(mockEventManager.publish).mockResolvedValue();

        // Act
        const result = await cancelMovementUseCase.execute(input);

        // Assert
        expect(result).toEqual({
          movementId: movement.id,
        });

        expect(mockMovementRepository.findById).toHaveBeenCalledWith(
          movement.id,
        );
        expect(mockMovementRepository.updateStatus).toHaveBeenCalledWith(
          movement.id,
          MovementStatus.CANCELLED,
        );
        expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
      }
    });

    it('should handle empty movementId', async () => {
      // Arrange
      const input = { movementId: '' };
      vi.mocked(mockMovementRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(cancelMovementUseCase.execute(input)).rejects.toThrow(
        MovementNotFoundError,
      );

      expect(mockMovementRepository.findById).toHaveBeenCalledWith('');
      expect(mockMovementRepository.updateStatus).not.toHaveBeenCalled();
      expect(mockEventManager.publish).not.toHaveBeenCalled();
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const input = { movementId: 'invalid-uuid' };
      vi.mocked(mockMovementRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(cancelMovementUseCase.execute(input)).rejects.toThrow(
        MovementNotFoundError,
      );

      expect(mockMovementRepository.findById).toHaveBeenCalledWith(
        'invalid-uuid',
      );
      expect(mockMovementRepository.updateStatus).not.toHaveBeenCalled();
      expect(mockEventManager.publish).not.toHaveBeenCalled();
    });

    it('should propagate repository updateStatus errors', async () => {
      // Arrange
      const input = { movementId: mockMovement.id };
      const updateError = new Error('Update failed');
      vi.mocked(mockMovementRepository.findById).mockResolvedValue(
        mockMovement,
      );
      vi.mocked(mockMovementRepository.updateStatus).mockRejectedValue(
        updateError,
      );

      // Act & Assert
      await expect(cancelMovementUseCase.execute(input)).rejects.toThrow(
        updateError,
      );

      expect(mockMovementRepository.findById).toHaveBeenCalledWith(
        mockMovement.id,
      );
      expect(mockMovementRepository.updateStatus).toHaveBeenCalledWith(
        mockMovement.id,
        MovementStatus.CANCELLED,
      );
      expect(mockEventManager.publish).not.toHaveBeenCalled();
    });

    it('should not propagate event manager publish errors (fire and forget)', async () => {
      // Arrange
      const input = { movementId: mockMovement.id };
      const publishError = new Error('Publish failed');
      vi.mocked(mockMovementRepository.findById).mockResolvedValue(
        mockMovement,
      );
      vi.mocked(mockMovementRepository.updateStatus).mockResolvedValue(
        mockUpdatedMovement,
      );
      vi.mocked(mockEventManager.publish).mockRejectedValue(publishError);

      // Act
      const result = await cancelMovementUseCase.execute(input);

      // Assert - Should succeed despite publish error (fire and forget)
      expect(result).toEqual({
        movementId: mockMovement.id,
      });

      expect(mockMovementRepository.findById).toHaveBeenCalledWith(
        mockMovement.id,
      );
      expect(mockMovementRepository.updateStatus).toHaveBeenCalledWith(
        mockMovement.id,
        MovementStatus.CANCELLED,
      );
      expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
    });
  });

  describe('constructor', () => {
    it('should create instance with dependencies', () => {
      // Act
      const useCase = new CancelMovementUseCase(
        mockMovementRepository,
        mockEventManager,
      );

      // Assert
      expect(useCase).toBeInstanceOf(CancelMovementUseCase);
    });
  });

  describe('type definitions', () => {
    it('should have correct input type', () => {
      const input: Parameters<ICancelMovementUseCase['execute']>[0] = {
        movementId: '123e4567-e89b-12d3-a456-426614174000',
      };

      expect(input.movementId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should have correct output type', () => {
      const output: Awaited<ReturnType<ICancelMovementUseCase['execute']>> = {
        movementId: '123e4567-e89b-12d3-a456-426614174000',
      };

      expect(output.movementId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });
});
