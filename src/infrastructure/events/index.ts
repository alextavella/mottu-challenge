import { createAccountEvent } from '../../core/events/account-event';
import { createMovementEvent } from '../../core/events/movement-event';
import { LedgerLogHandler } from '../../core/handlers/ledger-handler';

// Export handlers
export const EventHandlers = {
  LedgerLogHandler,
};

// Event Factory
export const EventFactory = {
  createMovementEvent,
  createAccountEvent,
};
