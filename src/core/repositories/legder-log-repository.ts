import {
  CreateLedgerLogData,
  ILedgerLogRepository,
} from '@/domain/contracts/repositories/ledger-log-repository';
import { LedgerLog, PrismaClient } from '@prisma/client';

export class LedgerLogRepository implements ILedgerLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateLedgerLogData): Promise<LedgerLog> {
    return await this.prisma.ledgerLog.create({
      data: {
        movementId: data.movementId,
        accountId: data.accountId,
        type: data.type,
        amount: data.amount,
        data: JSON.stringify(data.data),
      },
    });
  }
}
