import { prisma } from '@/database/client';
import { EventHandler } from '../../lib/events/types';
import { MovementEvent } from '../events/movement-event';

export class LedgerLogHandler implements EventHandler<MovementEvent> {
  async handle(event: MovementEvent): Promise<void> {
    console.log(`Processing ledger log for movement: ${event.data.id}`);

    await prisma.ledgerLog
      .create({
        data: {
          movementId: event.data.id,
          accountId: event.data.accountId,
          type: event.type,
          amount: event.data.amount,
          data: JSON.stringify(event.data),
        },
      })
      .catch(() => {
        throw new Error(
          `Failed to create ledger log for movement ${event.data.id}`,
        );
      });
  }
}
