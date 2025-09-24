import { CompleteMovementUseCase } from '@/core/usecases/movements/complete-movement-usecase';
import { IAccountRepository } from '@/domain/contracts/repositories/account-repository';
import { IBalanceRepository } from '@/domain/contracts/repositories/balance-repository';
import { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';
import { AccountData } from '@/domain/entities/account.entity';
import { MovementData } from '@/domain/entities/movement.entity';
import { AccountNotFoundError } from '@/domain/errors/account.errors';
import { MovementNotFoundError } from '@/domain/errors/movement.errors';
import { IEventManager } from '@/infra/events/types';
import { MovementStatus, MovementType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock EventFactory
vi.mock('@/core/events', () => ({
  EventFactory: {
    createAccountEvent: vi.fn().mockReturnValue({
      id: 'account-event-id',
      type: 'account.balance_updated',
      timestamp: new Date(),
      data: { id: 'account-id' },
    }),
    createMovementEvent: vi.fn().mockReturnValue({
      id: 'movement-event-id',
      type: 'movement.updated',
      timestamp: new Date(),
      data: { id: 'movement-id' },
    }),
  },
}));

describe('CompleteMovementUseCase', () => {
  let useCase: CompleteMovementUseCase;
  let mockAccountRepository: IAccountRepository;
  let mockBalanceRepository: IBalanceRepository;
  let mockMovementRepository: IMovementRepository;
  let mockEventManager: IEventManager;

  beforeEach(() => {
    mockAccountRepository = {
      findById: vi.fn(),
      findByDocumentOrEmail: vi.fn(),
      create: vi.fn(),
      getBalance: vi.fn(),
    };

    mockBalanceRepository = {
      updateBalance: vi.fn(),
    };

    mockMovementRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      updateStatus: vi.fn(),
      findByAccountId: vi.fn(),
    };

    mockEventManager = {
      publish: vi.fn(),
      publishBatch: vi.fn(),
      subscribe: vi.fn(),
      startConsumer: vi.fn(),
      stopConsumer: vi.fn(),
    };

    useCase = new CompleteMovementUseCase(
      mockAccountRepository,
      mockBalanceRepository,
      mockMovementRepository,
      mockEventManager,
    );
  });

  describe('execute', () => {
    it('should complete a credit movement successfully', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const accountId = '123e4567-e89b-12d3-a456-426614174001';

      const movement: MovementData = {
        id: movementId,
        accountId,
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Credit movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const account: AccountData = {
        id: accountId,
        name: 'Test Account',
        document: '12345678901',
        email: 'test@example.com',
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMovement: MovementData = {
        ...movement,
        status: MovementStatus.COMPLETED,
      };

      const updatedAccount: AccountData = {
        ...account,
        balance: 1100.5,
      };

      vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
      vi.mocked(mockAccountRepository.findById).mockResolvedValue(account);
      vi.mocked(mockBalanceRepository.updateBalance).mockResolvedValue(
        updatedMovement,
      );

      const result = await useCase.execute({ movementId });

      expect(mockMovementRepository.findById).toHaveBeenCalledWith(movementId);
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
      expect(mockBalanceRepository.updateBalance).toHaveBeenCalledWith(
        movement,
        1100.5,
      );
      expect(mockEventManager.publishBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'account.balance_updated',
          }),
          expect.objectContaining({
            type: 'movement.updated',
          }),
        ]),
      );

      expect(result).toEqual({
        movementId: updatedMovement.id,
        status: updatedMovement.status,
      });
    });

    it('should complete a debit movement successfully', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const accountId = '123e4567-e89b-12d3-a456-426614174001';

      const movement: MovementData = {
        id: movementId,
        accountId,
        amount: 50.25,
        type: MovementType.DEBIT,
        description: 'Debit movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const account: AccountData = {
        id: accountId,
        name: 'Test Account',
        document: '12345678901',
        email: 'test@example.com',
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMovement: MovementData = {
        ...movement,
        status: MovementStatus.COMPLETED,
      };

      vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
      vi.mocked(mockAccountRepository.findById).mockResolvedValue(account);
      vi.mocked(mockBalanceRepository.updateBalance).mockResolvedValue(
        updatedMovement,
      );

      const result = await useCase.execute({ movementId });

      expect(mockBalanceRepository.updateBalance).toHaveBeenCalledWith(
        movement,
        949.75,
      );

      expect(result).toEqual({
        movementId: updatedMovement.id,
        status: updatedMovement.status,
      });
    });

    it('should throw MovementNotFoundError when movement does not exist', async () => {
      const movementId = 'non-existent-movement';

      vi.mocked(mockMovementRepository.findById).mockResolvedValue(null);

      await expect(useCase.execute({ movementId })).rejects.toThrow(
        MovementNotFoundError,
      );

      expect(mockAccountRepository.findById).not.toHaveBeenCalled();
      expect(mockBalanceRepository.updateBalance).not.toHaveBeenCalled();
    });

    it('should throw MovementNotFoundError when movement repository throws error', async () => {
      const movementId = 'movement-id';
      const error = new Error('Database error');

      vi.mocked(mockMovementRepository.findById).mockRejectedValue(error);

      await expect(useCase.execute({ movementId })).rejects.toThrow(
        MovementNotFoundError,
      );
    });

    it('should throw AccountNotFoundError when account does not exist', async () => {
      const movementId = 'movement-id';
      const accountId = 'non-existent-account';

      const movement: MovementData = {
        id: movementId,
        accountId,
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Credit movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
      vi.mocked(mockAccountRepository.findById).mockResolvedValue(null);

      await expect(useCase.execute({ movementId })).rejects.toThrow(
        AccountNotFoundError,
      );

      expect(mockBalanceRepository.updateBalance).not.toHaveBeenCalled();
    });

    it('should throw AccountNotFoundError when account repository throws error', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const accountId = '123e4567-e89b-12d3-a456-426614174001';

      const movement: MovementData = {
        id: movementId,
        accountId,
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Credit movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const error = new Error('Database error');

      vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
      vi.mocked(mockAccountRepository.findById).mockRejectedValue(error);

      await expect(useCase.execute({ movementId })).rejects.toThrow(
        AccountNotFoundError,
      );
    });

    it('should handle small amount movements', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const accountId = '123e4567-e89b-12d3-a456-426614174001';

      const movement: MovementData = {
        id: movementId,
        accountId,
        amount: 0.01,
        type: MovementType.CREDIT,
        description: 'Small amount movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const account: AccountData = {
        id: accountId,
        name: 'Test Account',
        document: '12345678901',
        email: 'test@example.com',
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMovement: MovementData = {
        ...movement,
        status: MovementStatus.COMPLETED,
      };

      vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
      vi.mocked(mockAccountRepository.findById).mockResolvedValue(account);
      vi.mocked(mockBalanceRepository.updateBalance).mockResolvedValue(
        updatedMovement,
      );

      const result = await useCase.execute({ movementId });

      expect(mockBalanceRepository.updateBalance).toHaveBeenCalledWith(
        movement,
        1000.01, // Balance should increase by 0.01
      );

      expect(result).toEqual({
        movementId: updatedMovement.id,
        status: updatedMovement.status,
      });
    });

    it('should handle large amounts', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const accountId = '123e4567-e89b-12d3-a456-426614174001';

      const movement: MovementData = {
        id: movementId,
        accountId,
        amount: 999999.99,
        type: MovementType.CREDIT,
        description: 'Large amount movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const account: AccountData = {
        id: accountId,
        name: 'Test Account',
        document: '12345678901',
        email: 'test@example.com',
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMovement: MovementData = {
        ...movement,
        status: MovementStatus.COMPLETED,
      };

      vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
      vi.mocked(mockAccountRepository.findById).mockResolvedValue(account);
      vi.mocked(mockBalanceRepository.updateBalance).mockResolvedValue(
        updatedMovement,
      );

      const result = await useCase.execute({ movementId });

      expect(mockBalanceRepository.updateBalance).toHaveBeenCalledWith(
        movement,
        1000999.99,
      );

      expect(result).toEqual({
        movementId: updatedMovement.id,
        status: updatedMovement.status,
      });
    });

    it('should publish events even if balance update fails', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const accountId = '123e4567-e89b-12d3-a456-426614174001';

      const movement: MovementData = {
        id: movementId,
        accountId,
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Credit movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const account: AccountData = {
        id: accountId,
        name: 'Test Account',
        document: '12345678901',
        email: 'test@example.com',
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const error = new Error('Balance update failed');
      vi.mocked(mockMovementRepository.findById).mockResolvedValue(movement);
      vi.mocked(mockAccountRepository.findById).mockResolvedValue(account);
      vi.mocked(mockBalanceRepository.updateBalance).mockRejectedValue(error);

      await expect(useCase.execute({ movementId })).rejects.toThrow(
        'Balance update failed',
      );

      // Events should not be published if balance update fails
      expect(mockEventManager.publishBatch).not.toHaveBeenCalled();
    });
  });
});
