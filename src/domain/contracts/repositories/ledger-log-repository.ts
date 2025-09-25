/* eslint-disable @typescript-eslint/no-explicit-any */
import { LedgerLogData } from '@/domain/entities/ledger-log.entity';
import { MovementType } from '@prisma/client';

export interface ILedgerLogRepository {
  create(data: CreateLedgerLogData): Promise<LedgerLogData>;
}

export type CreateLedgerLogData = {
  movementId: string;
  accountId: string;
  amount: number;
  type: MovementType;
  data: Record<string, any>;
};
