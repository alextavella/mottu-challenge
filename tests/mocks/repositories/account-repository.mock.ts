import type { AccountRepository } from '@/domain/repositories/account-repository';

/**
 * Mock do AccountRepository para uso em testes unitários
 */
export const createAccountRepositoryMock = (): AccountRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByDocumentOrEmail: vi.fn(),
  updateBalance: vi.fn(),
  getBalance: vi.fn(),
});

/**
 * Mock pré-configurado do AccountRepository com comportamentos padrão
 */
export const mockAccountRepository = createAccountRepositoryMock();
