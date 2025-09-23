import { IAccountRepository } from '@/core/contracts/repositories/account-repository';
import { IMovementRepository } from '@/core/contracts/repositories/movement-repository';
import { AccountNotFoundError } from '@/core/errors/account.errors';
import { InsufficientFundsError } from '@/core/errors/movement.errors';
import { ServerError } from '@/core/errors/server.error';
import { CreateMovementUseCase } from '@/core/usecases/movements/create-movement-usecase';
import { Prisma } from '@prisma/client';
import { createAccountRepositoryMock } from 'tests/mocks/core/repositories/account-repository.mock';
import { createMovementRepositoryMock } from 'tests/mocks/core/repositories/movement-repository.mock';

describe('CreateMovementUseCase', () => {
  let createMovementUseCase: CreateMovementUseCase;
  let mockMovementRepository: IMovementRepository;
  let mockAccountRepository: IAccountRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMovementRepository = createMovementRepositoryMock();
    mockAccountRepository = createAccountRepositoryMock();
    createMovementUseCase = new CreateMovementUseCase(
      mockMovementRepository,
      mockAccountRepository,
    );
  });

  describe('execute', () => {
    it('should create a credit movement successfully', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 100,
        type: 'CREDIT' as const,
        description: 'Salary deposit',
      };

      const existingAccount = {
        id: 'account-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(500),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedMovement = {
        id: 'movement-id-123',
        accountId: 'account-id-123',
        amount: new Prisma.Decimal(100),
        type: 'CREDIT' as const,
        description: 'Salary deposit',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newBalance = new Prisma.Decimal(600);

      vi.mocked(mockAccountRepository.findById).mockResolvedValue(
        existingAccount,
      );
      vi.mocked(mockMovementRepository.create).mockResolvedValue(
        expectedMovement,
      );
      vi.mocked(mockAccountRepository.updateBalance).mockResolvedValue({
        ...existingAccount,
        balance: newBalance,
      });

      const result = await createMovementUseCase.execute(movementData);

      expect(result).toEqual({ movementId: 'movement-id-123' });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'account-id-123',
      );
      expect(mockMovementRepository.create).toHaveBeenCalledWith(movementData);
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        'account-id-123',
        newBalance,
      );
    });

    it('should create a debit movement successfully', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 50,
        type: 'DEBIT' as const,
        description: 'ATM withdrawal',
      };

      const existingAccount = {
        id: 'account-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(500),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedMovement = {
        id: 'movement-id-123',
        accountId: 'account-id-123',
        amount: new Prisma.Decimal(50),
        type: 'DEBIT' as const,
        description: 'ATM withdrawal',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newBalance = new Prisma.Decimal(450);

      vi.mocked(mockAccountRepository.findById).mockResolvedValue(
        existingAccount,
      );
      vi.mocked(mockMovementRepository.create).mockResolvedValue(
        expectedMovement,
      );
      vi.mocked(mockAccountRepository.updateBalance).mockResolvedValue({
        ...existingAccount,
        balance: newBalance,
      });

      const result = await createMovementUseCase.execute(movementData);

      expect(result).toEqual({ movementId: 'movement-id-123' });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'account-id-123',
      );
      expect(mockMovementRepository.create).toHaveBeenCalledWith(movementData);
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        'account-id-123',
        newBalance,
      );
    });

    it('should throw AccountNotFoundError if account not found', async () => {
      const movementData = {
        accountId: 'non-existent-account',
        amount: 100,
        type: 'CREDIT' as const,
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
      expect(mockAccountRepository.updateBalance).not.toHaveBeenCalled();
    });

    it('should throw InsufficientFundsError if debit amount exceeds balance', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 1000,
        type: 'DEBIT' as const,
        description: 'Large withdrawal',
      };

      const existingAccount = {
        id: 'account-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(500),
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
      expect(mockAccountRepository.updateBalance).not.toHaveBeenCalled();
    });

    it('should throw ServerError if repository throws an error', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 100,
        type: 'CREDIT' as const,
        description: 'Test movement',
      };

      const repositoryError = new Error('Database connection failed');
      vi.mocked(mockAccountRepository.findById).mockRejectedValue(
        repositoryError,
      );

      await expect(createMovementUseCase.execute(movementData)).rejects.toThrow(
        new ServerError('Failed to create movement', repositoryError),
      );

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'account-id-123',
      );
      expect(mockMovementRepository.create).not.toHaveBeenCalled();
    });

    it('should handle zero amount movement', async () => {
      const movementData = {
        accountId: 'account-id-123',
        amount: 0,
        type: 'CREDIT' as const,
        description: 'Zero amount test',
      };

      const existingAccount = {
        id: 'account-id-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(500),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedMovement = {
        id: 'movement-id-123',
        accountId: 'account-id-123',
        amount: new Prisma.Decimal(0),
        type: 'CREDIT' as const,
        description: 'Zero amount test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockAccountRepository.findById).mockResolvedValue(
        existingAccount,
      );
      vi.mocked(mockMovementRepository.create).mockResolvedValue(
        expectedMovement,
      );
      vi.mocked(mockAccountRepository.updateBalance).mockResolvedValue({
        ...existingAccount,
        balance: new Prisma.Decimal(500), // Balance remains the same
      });

      const result = await createMovementUseCase.execute(movementData);

      expect(result).toEqual({ movementId: 'movement-id-123' });
      expect(mockAccountRepository.updateBalance).toHaveBeenCalledWith(
        'account-id-123',
        new Prisma.Decimal(500),
      );
    });
  });
});
