import type { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';

/**
 * Mock do IMovementRepository para uso em testes unitários
 */
export const createMovementRepositoryMock = (): IMovementRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByAccountId: vi.fn(),
});

/**
 * Mock pré-configurado do IMovementRepository com comportamentos padrão
 */
export const mockMovementRepository = createMovementRepositoryMock();
