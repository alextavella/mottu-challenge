import type { MovementRepository } from '@/domain/repositories/movement-repository';

/**
 * Mock do MovementRepository para uso em testes unitários
 */
export const createMovementRepositoryMock = (): MovementRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByAccountId: vi.fn(),
});

/**
 * Mock pré-configurado do MovementRepository com comportamentos padrão
 */
export const mockMovementRepository = createMovementRepositoryMock();
