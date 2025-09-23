import { createAccountEvent } from './events/account-event';
import { createMovementEvent } from './events/movement-event';
import { LedgerLogHandler } from './handlers/ledger-handler';

// Export handlers
export const EventHandlers = {
  LedgerLogHandler,
};

// Event Factory
export const EventFactory = {
  createMovementEvent,
  createAccountEvent,
};
