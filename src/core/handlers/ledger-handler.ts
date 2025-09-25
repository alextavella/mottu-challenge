import { createLedgerLogSchema } from '@/domain/entities/ledger-log.entity';
import { ServerError } from '@/domain/errors/server.error';
import { IEventHandler } from '@/infra/events/types';
import { MovementEvent } from '../events/movement-event';
import { ICreateLedgerLogUseCase } from '../usecases/ledger-log/create-ledger-log-usecase';

export class LedgerLogHandler implements IEventHandler<MovementEvent> {
  constructor(
    private readonly createLedgerLogUseCase: ICreateLedgerLogUseCase,
  ) {}

  async handle(event: MovementEvent): Promise<void> {
    const ledgerLogData = {
      movementId: event.data.id,
      accountId: event.data.accountId,
      type: event.data.type,
      amount: event.data.amount,
      data: event.data || {},
    };

    const result = createLedgerLogSchema.safeParse(ledgerLogData);

    if (!result.success) {
      throw new ServerError(
        `Failed to validate ledger log: ${result.error.message}`,
        result.error,
      );
    }

    try {
      await this.createLedgerLogUseCase.execute(result.data);
    } catch (error) {
      throw new ServerError(
        `Failed to create ledger log for movement ${event.data.id}`,
        error as Error,
      );
    }
  }
}
