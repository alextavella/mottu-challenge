import { MovementEventType } from '@/core/events/movement-event';
import { getEventManager } from '@/infrastructure/events/event-manager';
import { EventHandlers } from '.';

export async function setupEventConsumers() {
  const eventManager = getEventManager();

  // Subscribe to movement events with ledger logging
  const ledgerHandler = new EventHandlers.LedgerLogHandler();

  // Subscribe to all movement events (using wildcard routing)
  await eventManager.subscribe(MovementEventType.ALL, ledgerHandler, {
    queue: 'ledger.all.movements',
    routingKey: 'movement.*',
  });

  // Start consuming messages
  await eventManager.startConsumer();
}
