import { ILedgerLogRepository } from '@/domain/contracts/repositories/ledger-log-repository';

export const createLedgerLogRepositoryMock = (): ILedgerLogRepository => ({
  create: vi.fn(),
});
