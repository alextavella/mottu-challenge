import type { IAccountRepository } from '@/domain/contracts/repositories/account-repository';

export const createAccountRepositoryMock = (): IAccountRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByDocumentOrEmail: vi.fn(),
  getBalance: vi.fn(),
});

export const mockAccountRepository = createAccountRepositoryMock();
