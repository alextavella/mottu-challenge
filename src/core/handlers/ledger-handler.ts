import { ILedgerLogRepository } from '@/domain/contracts/repositories/ledger-log-repository';
import { ServerError, throwServerError } from '@/domain/errors/server.error';
import { IEventHandler } from '@/infra/events/types';
import z from 'zod';
import { MovementEvent } from '../events/movement-event';

const ledgerLogSchema = z.object({
  id: z.uuid({ message: 'ID deve ser um UUID válido' }),
  movementId: z.uuid({ message: 'MovementId deve ser um UUID válido' }),
  accountId: z.uuid({ message: 'AccountId deve ser um UUID válido' }),
  type: z.enum(['CREDIT', 'DEBIT'], {
    message: 'Tipo de movimento é obrigatório',
  }),
  amount: z.number({ message: 'Amount é obrigatório' }),
  data: z.object({}),
});

export class LedgerLogHandler implements IEventHandler<MovementEvent> {
  constructor(private readonly ledgerLogRepository: ILedgerLogRepository) {}

  async handle(event: MovementEvent): Promise<void> {
    console.log(`Processing ledger log for movement: ${event.data.id}`);

    const ledgerData = {
      id: event.id,
      movementId: event.data.id,
      accountId: event.data.accountId,
      type: event.data.type,
      amount: Number(event.data.amount),
      data: event.data,
    };

    const result = ledgerLogSchema.safeParse(ledgerData);

    if (!result.success) {
      throw new ServerError(
        `Failed to validate ledger log: ${result.error.message}`,
        result.error,
      );
    }

    const { id: movementId, accountId, type, amount, data } = result.data;

    await this.ledgerLogRepository
      .create({
        movementId,
        accountId,
        type,
        amount,
        data,
      })
      .catch(
        throwServerError(
          `Failed to create ledger log for movement ${movementId}`,
        ),
      );
  }
}
