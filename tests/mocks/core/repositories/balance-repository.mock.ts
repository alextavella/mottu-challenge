import { IBalanceRepository } from '@/domain/contracts/repositories/balance-repository';

export const createBalanceRepositoryMock = (): IBalanceRepository => ({
  updateBalance: vi.fn(),
});
