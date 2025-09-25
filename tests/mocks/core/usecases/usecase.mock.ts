import { IUseCase } from '@/domain/contracts/usecases/interfaces';
import { vi } from 'vitest';

export const createUseCaseMock = (): IUseCase<any, any> => ({
  execute: vi.fn(),
});
