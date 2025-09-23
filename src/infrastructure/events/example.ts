import { getEventManager } from '@/infrastructure/events/event-manager';
import { Prisma } from '@prisma/client';
import { AccountEvent } from './events/account-event';
import { MovementEventType } from './events/movement-event';
import { EventFactory, EventHandlers } from './index';

// Example: Publishing events
export async function publishMovementEvent() {
  const eventManager = getEventManager();

  // Create a movement event
  const movementEvent = EventFactory.createMovementEvent(
    MovementEventType.CREATED,
    {
      id: 'mov_123',
      accountId: 'acc_456',
      amount: new Prisma.Decimal(100.5),
      type: 'CREDIT',
      description: 'Salary deposit',
      createdAt: new Date(),
    },
    'correlation_123', // Optional correlation ID for tracing
  );

  // Publish the event
  await eventManager.publish(movementEvent);
}

// Example: Publishing batch events
export async function publishBatchEvents() {
  const eventManager = getEventManager();

  const events = [
    EventFactory.createMovementEvent(MovementEventType.CREATED, {
      id: 'mov_1',
      accountId: 'acc_1',
      amount: new Prisma.Decimal(50),
      type: 'DEBIT',
      description: 'Withdrawal',
      createdAt: new Date(),
    }),
    EventFactory.createMovementEvent(MovementEventType.CREATED, {
      id: 'mov_2',
      accountId: 'acc_1',
      amount: new Prisma.Decimal(25),
      type: 'CREDIT',
      description: 'Deposit',
      createdAt: new Date(),
    }),
  ];

  await eventManager.publishBatch(events);
}

// Example: Setting up consumers
export async function setupEventConsumers() {
  const eventManager = getEventManager();

  // Subscribe to movement events with ledger logging
  const ledgerHandler = new EventHandlers.LedgerLogHandler();

  await eventManager.subscribe(MovementEventType.CREATED, ledgerHandler, {
    queue: 'ledger.movement.created',
    prefetch: 5, // Process 5 messages at a time
    retryAttempts: 3,
    retryDelay: 2000,
  });

  // Subscribe to all movement events (using wildcard routing)
  await eventManager.subscribe(MovementEventType.ALL, ledgerHandler, {
    queue: 'ledger.all.movements',
    routingKey: 'movement.*',
  });

  // Start consuming messages
  await eventManager.startConsumer();
}

// Example: Custom event handler
export class AccountBalanceHandler {
  async handle(event: AccountEvent): Promise<void> {
    console.log(
      `Account balance updated: ${event.data.id} = ${event.data.balance}`,
    );

    // You could trigger notifications, update caches, etc.
    // For example:
    // - Send push notification if balance is low
    // - Update real-time dashboard
    // - Trigger fraud detection if unusual activity
  }
}

// Example: Integration in your route handlers
export async function exampleRouteIntegration() {
  const eventManager = getEventManager();

  // In your movement creation route:
  // 1. Save to database transactionally
  // 2. Publish event after successful save

  try {
    // Your database transaction here
    const movement = {
      id: 'mov_789',
      accountId: 'acc_123',
      amount: new Prisma.Decimal(200),
      type: 'CREDIT' as const,
      description: 'Transfer',
      createdAt: new Date(),
    };

    // After successful database save:
    const event = EventFactory.createMovementEvent(
      MovementEventType.CREATED,
      movement,
    );

    await eventManager.publish(event);
  } catch (error) {
    console.error('Failed to process movement:', error);
    throw error;
  }
}
