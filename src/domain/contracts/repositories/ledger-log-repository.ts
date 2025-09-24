/* eslint-disable @typescript-eslint/no-explicit-any */
import { LedgerLog, MovementType } from '@prisma/client';

export interface ILedgerLogRepository {
  create(data: CreateLedgerLogData): Promise<LedgerLog>;
}

export type CreateLedgerLogData = {
  movementId: string;
  accountId: string;
  amount: number;
  type: MovementType;
  data: Record<string, any>;
};
