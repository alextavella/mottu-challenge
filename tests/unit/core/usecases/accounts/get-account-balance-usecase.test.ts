import { GetAccountBalanceUseCase } from '@/core/usecases/accounts/get-account-balance-usecase';
import { IAccountRepository } from '@/domain/contracts/repositories/account-repository';
import { AccountNotFoundError } from '@/domain/errors/account.errors';
import { ServerError } from '@/domain/errors/server.error';
import { Prisma } from '@prisma/client';
import { createMockAccountData } from 'tests/mocks/core/entities/test-data.mock';
import { createAccountRepositoryMock } from 'tests/mocks/core/repositories/account-repository.mock';

describe('GetAccountBalanceUseCase', () => {
  let getAccountBalanceUseCase: GetAccountBalanceUseCase;
  let mockAccountRepository: IAccountRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountRepository = createAccountRepositoryMock();
    getAccountBalanceUseCase = new GetAccountBalanceUseCase(
      mockAccountRepository,
    );
  });

  describe('execute', () => {
    it('should return account balance successfully', async () => {
      const accountId = 'account-id-123';
      const account = createMockAccountData({
        id: accountId,
        name: 'John Doe',
        balance: new Prisma.Decimal(1500.5),
      });

      (mockAccountRepository.findById as any).mockResolvedValue(account);

      const result = await getAccountBalanceUseCase.execute({ accountId });

      expect(result).toEqual({
        accountId,
        name: 'John Doe',
        balance: 1500.5,
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
    });

    it('should throw AccountNotFoundError if account not found', async () => {
      const accountId = 'non-existent-account';

      (mockAccountRepository.findById as any).mockResolvedValue(null);

      await expect(
        getAccountBalanceUseCase.execute({ accountId }),
      ).rejects.toThrow(new AccountNotFoundError('non-existent-account'));

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
    });

    it('should throw AccountNotFoundError if repository throws an error', async () => {
      const accountId = 'account-id-123';
      const repositoryError = new Error('Database connection failed');

      (mockAccountRepository.findById as any).mockRejectedValue(
        repositoryError,
      );

      await expect(
        getAccountBalanceUseCase.execute({ accountId }),
      ).rejects.toThrow(
        new AccountNotFoundError(accountId),
      );

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
    });

    it('should handle zero balance', async () => {
      const accountId = 'account-id-123';
      const account = createMockAccountData({
        accountId,
        name: 'John Doe',
        balance: new Prisma.Decimal(0),
      });

      (mockAccountRepository.findById as any).mockResolvedValue(account);

      const result = await getAccountBalanceUseCase.execute({ accountId });

      expect(result).toEqual({
        accountId,
        name: 'John Doe',
        balance: 0,
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
    });

    it('should handle negative balance', async () => {
      const accountId = 'account-id-123';
      const account = createMockAccountData({
        id: accountId,
        name: 'John Doe',
        document: '12345678901',
        balance: new Prisma.Decimal(-100.25),
      });

      (mockAccountRepository.findById as any).mockResolvedValue(account);

      const result = await getAccountBalanceUseCase.execute({ accountId });

      expect(result).toEqual({
        accountId,
        name: 'John Doe',
        balance: -100.25,
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
    });

    it('should handle large balance values', async () => {
      const accountId = 'account-id-123';
      const account = createMockAccountData({
        id: accountId,
        name: 'John Doe',
        document: '12345678901',
        email: 'john@example.com',
        balance: new Prisma.Decimal('999999999.99'),
      });

      (mockAccountRepository.findById as any).mockResolvedValue(account);

      const result = await getAccountBalanceUseCase.execute({ accountId });

      expect(result).toEqual({
        accountId,
        name: 'John Doe',
        balance: 999999999.99,
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(accountId);
    });
  });
});
