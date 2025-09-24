import { CreateMovementUseCase } from '@/core/usecases/movements/create-movement-usecase';
import { IAccountRepository } from '@/domain/contracts/repositories/account-repository';
import { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';
import { AccountNotFoundError } from '@/domain/errors/account.errors';
import { InsufficientFundsError } from '@/domain/errors/movement.errors';
import { IEventManager } from '@/infra/events/types';
import { MovementStatus, MovementType } from '@prisma/client';
import { createAccountRepositoryMock } from 'tests/mocks/core/repositories/account-repository.mock';
import { createMovementRepositoryMock } from 'tests/mocks/core/repositories/movement-repository.mock';
import { createEventManagerMock } from 'tests/mocks/infrastructure/events/event-system.mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CreateMovementUseCase', () => {
  let createMovementUseCase: CreateMovementUseCase;
  let mockAccountRepository: IAccountRepository;
  let mockMovementRepository: IMovementRepository;
  let mockEventManager: IEventManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountRepository = createAccountRepositoryMock();
    mockMovementRepository = createMovementRepositoryMock();
    mockEventManager = createEventManagerMock();
    createMovementUseCase = new CreateMovementUseCase(
      mockAccountRepository,
      mockMovementRepository,
      mockEventManager,
    );
  });

  describe('execute', () => {
    it('should create a credit movement successfully', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Salary deposit',
      };

      const existingAccount = {
        id: 'account-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedMovement = {
        id: 'movement-id-123',
        accountId: 'account-id-123',
        amount: 100,
        type: MovementType.CREDIT,
        status: MovementStatus.PENDING,
        description: 'Salary deposit',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockAccountRepository.findById).mockResolvedValue(
        existingAccount,
      );
      vi.mocked(mockMovementRepository.create).mockResolvedValue(
        expectedMovement,
      );

      const result = await createMovementUseCase.execute(movementData);

      expect(result).toEqual({ movementId: 'movement-id-123' });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'account-id-123',
      );
      expect(mockMovementRepository.create).toHaveBeenCalledWith(movementData);
      expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
      expect(mockEventManager.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'movement.created',
          data: expectedMovement,
        }),
      );
    });

    it('should create a debit movement successfully', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 50,
        type: MovementType.DEBIT,
        description: 'ATM withdrawal',
      };

      const existingAccount = {
        id: 'account-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedMovement = {
        id: 'movement-id-123',
        accountId: 'account-id-123',
        amount: 50,
        type: MovementType.DEBIT,
        status: MovementStatus.PENDING,
        description: 'ATM withdrawal',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockAccountRepository.findById).mockResolvedValue(
        existingAccount,
      );
      vi.mocked(mockMovementRepository.create).mockResolvedValue(
        expectedMovement,
      );

      const result = await createMovementUseCase.execute(movementData);

      expect(result).toEqual({ movementId: 'movement-id-123' });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'account-id-123',
      );
      expect(mockMovementRepository.create).toHaveBeenCalledWith(movementData);
      expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
      expect(mockEventManager.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'movement.created',
          data: expectedMovement,
        }),
      );
    });

    it('should throw AccountNotFoundError if account not found', async () => {
      const movementData = {
        accountId: 'non-existent-account',
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Test movement',
      };

      vi.mocked(mockAccountRepository.findById).mockResolvedValue(null);

      await expect(createMovementUseCase.execute(movementData)).rejects.toThrow(
        new AccountNotFoundError('non-existent-account'),
      );

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'non-existent-account',
      );
      expect(mockMovementRepository.create).not.toHaveBeenCalled();
      expect(mockEventManager.publish).not.toHaveBeenCalled();
    });

    it('should throw InsufficientFundsError if debit amount exceeds balance', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 1000,
        type: MovementType.DEBIT,
        description: 'Large withdrawal',
      };

      const existingAccount = {
        id: 'account-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockAccountRepository.findById).mockResolvedValue(
        existingAccount,
      );

      await expect(createMovementUseCase.execute(movementData)).rejects.toThrow(
        new InsufficientFundsError('account-id-123', 1000, 500),
      );

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'account-id-123',
      );
      expect(mockMovementRepository.create).not.toHaveBeenCalled();
      expect(mockEventManager.publish).not.toHaveBeenCalled();
    });

    it('should throw ServerError if repository throws an error', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Test movement',
      };

      const repositoryError = new Error('Database connection failed');
      vi.mocked(mockAccountRepository.findById).mockRejectedValue(
        repositoryError,
      );

      await expect(createMovementUseCase.execute(movementData)).rejects.toThrow(
        new AccountNotFoundError('account-id-123'),
      );

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'account-id-123',
      );
      expect(mockMovementRepository.create).not.toHaveBeenCalled();
      expect(mockEventManager.publish).not.toHaveBeenCalled();
    });

    it('should reject zero amount movement', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 0,
        type: MovementType.CREDIT,
        description: 'Zero amount test',
      };

      const existingAccount = {
        id: 'account-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockAccountRepository.findById).mockResolvedValue(
        existingAccount,
      );

      await expect(createMovementUseCase.execute(movementData)).rejects.toThrow(
        'Invalid movement amount: 0',
      );

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'account-id-123',
      );
      expect(mockMovementRepository.create).not.toHaveBeenCalled();
      expect(mockEventManager.publish).not.toHaveBeenCalled();
    });

    it('should handle event publishing failure gracefully', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Credit with event failure',
      };

      const existingAccount = {
        id: 'account-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedMovement = {
        id: 'movement-id-123',
        accountId: 'account-id-123',
        amount: 100,
        type: MovementType.CREDIT,
        status: MovementStatus.PENDING,
        description: 'Credit with event failure',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockAccountRepository.findById).mockResolvedValue(
        existingAccount,
      );
      vi.mocked(mockMovementRepository.create).mockResolvedValue(
        expectedMovement,
      );

      // Mock event manager to fail
      vi.mocked(mockEventManager.publish).mockRejectedValue(
        new Error('Event publishing failed'),
      );

      const result = await createMovementUseCase.execute(movementData);

      expect(result).toEqual({ movementId: 'movement-id-123' });
      expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
    });
  });
});
