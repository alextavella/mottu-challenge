import type { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';

export const createMovementRepositoryMock = (): IMovementRepository => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByAccountId: vi.fn(),
  updateStatus: vi.fn(),
});

export const mockMovementRepository = createMovementRepositoryMock();
