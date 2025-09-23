import type { IAccountRepository } from '@/core/contracts/repositories/account-repository';

/**
 * Mock do IAccountRepository para uso em testes unitários
 */
export const createAccountRepositoryMock = (): IAccountRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByDocumentOrEmail: vi.fn(),
  updateBalance: vi.fn(),
  getBalance: vi.fn(),
});

/**
 * Mock pré-configurado do IAccountRepository com comportamentos padrão
 */
export const mockAccountRepository = createAccountRepositoryMock();
