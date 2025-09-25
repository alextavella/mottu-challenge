import {
  CreateLedgerLogData,
  ILedgerLogRepository,
} from '@/domain/contracts/repositories/ledger-log-repository';
import {
  LedgerLogData,
  ledgerLogSchema,
} from '@/domain/entities/ledger-log.entity';
import { PrismaClient } from '@prisma/client';

export class LedgerLogRepository implements ILedgerLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateLedgerLogData): Promise<LedgerLogData> {
    return await this.prisma.ledgerLog
      .create({
        data: {
          movementId: data.movementId,
          accountId: data.accountId,
          type: data.type,
          amount: data.amount,
          data: JSON.stringify(data.data),
        },
      })
      .then((ledgerLog) => ledgerLogSchema.parse(ledgerLog));
  }
}
