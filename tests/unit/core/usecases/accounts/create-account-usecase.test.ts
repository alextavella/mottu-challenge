import { CreateAccountUseCase } from '@/core/usecases/accounts/create-account-usecase';
import { IAccountRepository } from '@/domain/contracts/repositories/account-repository';
import { BusinessRuleViolationError } from '@/domain/errors/account.errors';
import { ServerError } from '@/domain/errors/server.error';
import { IEventManager } from '@/infra/events/types';
import {
  createMockAccountData,
  createMockAccountInput,
} from 'tests/mocks/core/entities/test-data.mock';
import { createAccountRepositoryMock } from 'tests/mocks/core/repositories/account-repository.mock';
import { createEventManagerMock } from 'tests/mocks/infra/events/event-system.mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CreateAccountUseCase', () => {
  let createAccountUseCase: CreateAccountUseCase;
  let mockAccountRepository: IAccountRepository;
  let mockEventManager: IEventManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountRepository = createAccountRepositoryMock();
    mockEventManager = createEventManagerMock();
    createAccountUseCase = new CreateAccountUseCase(
      mockAccountRepository,
      mockEventManager,
    );
  });

  describe('execute', () => {
    it('should create an account successfully', async () => {
      const accountData = createMockAccountInput();
      const expectedAccount = createMockAccountData();

      vi.mocked(mockAccountRepository.findByDocumentOrEmail).mockResolvedValue(
        null,
      );
      vi.mocked(mockAccountRepository.create).mockResolvedValue(
        expectedAccount,
      );

      const result = await createAccountUseCase.execute(accountData);

      expect(result).toEqual({ accountId: 'account-id-123' });
      expect(mockAccountRepository.findByDocumentOrEmail).toHaveBeenCalledWith(
        '12345678901',
        'john@example.com',
      );
      expect(mockAccountRepository.create).toHaveBeenCalledWith({
        name: 'John Doe',
        document: '12345678901',
        email: 'john@example.com',
      });
      expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
      expect(mockEventManager.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'account.created',
          data: expectedAccount,
        }),
      );
    });

    it('should throw BusinessRuleViolationError if account already exists', async () => {
      const accountData = {
        name: 'John Doe',
        document: '12345678901',
        email: 'john@example.com',
      };

      const existingAccount = {
        id: 'existing-account-id',
        name: 'John Doe',
        document: '12345678901',
        email: 'john@example.com',
        balance: new (require('@prisma/client').Prisma.Decimal)(100),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockAccountRepository.findByDocumentOrEmail).mockResolvedValue(
        existingAccount,
      );

      await expect(createAccountUseCase.execute(accountData)).rejects.toThrow(
        new BusinessRuleViolationError(
          'Account already exists with this document or email',
        ),
      );

      expect(mockAccountRepository.findByDocumentOrEmail).toHaveBeenCalledWith(
        '12345678901',
        'john@example.com',
      );
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ServerError if repository throws an error', async () => {
      const accountData = {
        name: 'John Doe',
        document: '12345678901',
        email: 'john@example.com',
      };

      const repositoryError = new Error('Database connection failed');
      vi.mocked(mockAccountRepository.findByDocumentOrEmail).mockRejectedValue(
        repositoryError,
      );

      await expect(createAccountUseCase.execute(accountData)).rejects.toThrow(
        new ServerError(
          'Failed to find account by document or email',
          repositoryError,
        ),
      );

      expect(mockAccountRepository.findByDocumentOrEmail).toHaveBeenCalledWith(
        '12345678901',
        'john@example.com',
      );
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ServerError if create operation fails', async () => {
      const accountData = {
        name: 'John Doe',
        document: '12345678901',
        email: 'john@example.com',
      };

      const createError = new Error('Failed to insert record');
      vi.mocked(mockAccountRepository.findByDocumentOrEmail).mockResolvedValue(
        null,
      );
      vi.mocked(mockAccountRepository.create).mockRejectedValue(createError);

      await expect(createAccountUseCase.execute(accountData)).rejects.toThrow(
        new ServerError('Failed to create account', createError),
      );

      expect(mockAccountRepository.findByDocumentOrEmail).toHaveBeenCalledWith(
        '12345678901',
        'john@example.com',
      );
      expect(mockAccountRepository.create).toHaveBeenCalledWith({
        name: 'John Doe',
        document: '12345678901',
        email: 'john@example.com',
      });
    });

    it('should handle document validation', async () => {
      const accountData = {
        name: 'John Doe',
        document: '',
        email: 'john@example.com',
      };

      // Assuming the use case validates empty documents
      vi.mocked(mockAccountRepository.findByDocumentOrEmail).mockResolvedValue(
        null,
      );
      vi.mocked(mockAccountRepository.create).mockResolvedValue({
        id: 'account-id-123',
        name: 'John Doe',
        document: '',
        email: 'john@example.com',
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createAccountUseCase.execute(accountData);

      expect(result).toEqual({ accountId: 'account-id-123' });
      expect(mockAccountRepository.findByDocumentOrEmail).toHaveBeenCalledWith(
        '',
        'john@example.com',
      );
    });

    it('should handle event publishing failure gracefully', async () => {
      const accountData = createMockAccountInput();
      const expectedAccount = createMockAccountData();

      vi.mocked(mockAccountRepository.findByDocumentOrEmail).mockResolvedValue(
        null,
      );
      vi.mocked(mockAccountRepository.create).mockResolvedValue(
        expectedAccount,
      );

      // Mock event manager to fail
      vi.mocked(mockEventManager.publish).mockRejectedValue(
        new Error('Event publishing failed'),
      );

      const result = await createAccountUseCase.execute(accountData);

      expect(result).toEqual({ accountId: 'account-id-123' });
      expect(mockEventManager.publish).toHaveBeenCalledTimes(1);
    });
  });
});
