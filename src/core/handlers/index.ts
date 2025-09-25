import { IEventManager } from '@/infra/events/types';
import { MovementEventType } from '../events/movement-event';
import { UseCaseContainer } from '../usecases/container/usecase.container';
import { LedgerLogHandler } from './ledger-handler';
import { MovementCancelledHandler } from './movement-cancelled-handler';
import { MovementCreatedHandler } from './movement-created-handler';

export enum QUEUES {
  ALL_MOVEMENTS = 'ledger.all.movements',
  MOVEMENT_CREATED = 'ledger.movement.created',
  MOVEMENT_CANCELLED = 'ledger.movement.cancelled',
}

export const ALL_QUEUES = Object.values(QUEUES);
export const ALL_DLQ_QUEUES = Object.values(QUEUES).map(
  (queue) => `${queue}.dlq`,
);

export async function setupEventConsumers(eventManager: IEventManager) {
  const container = UseCaseContainer.getInstance(eventManager);
  const completeMovementUseCase = container.getCompleteMovementUsecase();
  const cancelMovementUseCase = container.getCancelMovementUsecase();
  const ledgerLogUseCase = container.getCreateLedgerLogUsecase();

  // Subscribe to movement events with ledger logging
  const ledgerHandler = new LedgerLogHandler(ledgerLogUseCase);
  const movementCreatedHandler = new MovementCreatedHandler(
    completeMovementUseCase,
  );
  const movementCancelledHandler = new MovementCancelledHandler(
    cancelMovementUseCase,
  );

  // Subscribe to all movement events (using wildcard routing)
  await eventManager.subscribe(MovementEventType.ALL, ledgerHandler, {
    queue: QUEUES.ALL_MOVEMENTS,
    routingKey: MovementEventType.ALL,
  });

  // Subscribe to movement created events with retry
  await eventManager.subscribe(
    MovementEventType.CREATED,
    movementCreatedHandler,
    {
      queue: QUEUES.MOVEMENT_CREATED,
      routingKey: MovementEventType.CREATED,
      prefetch: 1,
      retryAttempts: 3,
      retryDelay: 5000,
    },
  );

  // Configure DLQ handler for movement.created events
  await eventManager.setDLQHandler(
    MovementEventType.CREATED,
    movementCancelledHandler,
  );

  // Start consuming messages
  await eventManager.startConsumer();
}
