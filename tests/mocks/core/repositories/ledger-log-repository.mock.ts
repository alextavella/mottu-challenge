import { ILedgerLogRepository } from '@/domain/contracts/repositories/ledger-log-repository';
import { vi } from 'vitest';

export const createLedgerLogRepositoryMock = (): ILedgerLogRepository => ({
  create: vi.fn(),
});
