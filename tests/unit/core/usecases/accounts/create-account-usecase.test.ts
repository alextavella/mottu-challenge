import { IAccountRepository } from '@/core/contracts/repositories/account-repository';
import { BusinessRuleViolationError } from '@/core/errors/account.errors';
import { ServerError } from '@/core/errors/server.error';
import { CreateAccountUseCase } from '@/core/usecases/accounts/create-account-usecase';
import { Prisma } from '@prisma/client';
import { createAccountRepositoryMock } from 'tests/mocks/core/repositories/account-repository.mock';
import {
  createMockAccountData,
  createMockAccountInput,
} from 'tests/mocks/core/test-data.mock';

describe('CreateAccountUseCase', () => {
  let createAccountUseCase: CreateAccountUseCase;
  let mockAccountRepository: IAccountRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountRepository = createAccountRepositoryMock();
    createAccountUseCase = new CreateAccountUseCase(mockAccountRepository);
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
        new ServerError('Failed to create account', repositoryError),
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
        balance: new Prisma.Decimal(1000),
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
  });
});
