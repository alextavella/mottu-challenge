import { ILedgerLogRepository } from '@/domain/contracts/repositories/ledger-log-repository';
import { ServerError, throwServerError } from '@/domain/errors/server.error';
import { IEventHandler } from '@/infra/events/types';
import { z } from 'zod';
import { MovementEvent } from '../events/movement-event';

const ledgerLogSchema = z.object({
  movementId: z.uuid({ message: 'MovementId deve ser um UUID válido' }),
  accountId: z.uuid({ message: 'AccountId deve ser um UUID válido' }),
  type: z.enum(['CREDIT', 'DEBIT'], {
    message: 'Tipo de movimento é obrigatório',
  }),
  amount: z.number({ message: 'Amount é obrigatório' }),
  data: z.record(z.string(), z.any()),
});

export class LedgerLogHandler implements IEventHandler<MovementEvent> {
  constructor(private readonly ledgerLogRepository: ILedgerLogRepository) {}

  async handle(event: MovementEvent): Promise<void> {
    console.log(`Processing ledger log for movement: ${event.data.id}`);

    const ledgerLogData = {
      movementId: event.data.id,
      accountId: event.data.accountId,
      type: event.data.type,
      amount: event.data.amount,
      data: event.data || {},
    };

    const result = ledgerLogSchema.safeParse(ledgerLogData);

    if (!result.success) {
      throw new ServerError(
        `Failed to validate ledger log: ${result.error.message}`,
        result.error,
      );
    }

    const ledgerData = result.data;

    // Skip strict validation to keep handler resilient and side-effect only
    await this.ledgerLogRepository
      .create(ledgerData)
      .catch(
        throwServerError(
          `Failed to create ledger log for movement ${ledgerData.movementId}`,
        ),
      );
  }
}
