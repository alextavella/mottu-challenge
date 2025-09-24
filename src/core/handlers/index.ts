import {
  getAccountRepository,
  getBalanceRepository,
  getLedgerLogRepository,
  getMovementRepository,
} from '@/infra/container/dependency-injection.container';
import { IEventManager } from '@/infra/events/types';
import { MovementEventType } from '../events/movement-event';
import { CompleteMovementUseCase } from '../usecases/movements/complete-movement-usecase';
import { LedgerLogHandler } from './ledger-handler';
import { MovementCreatedHandler } from './movement-handler';

export async function setupEventConsumers(eventManager: IEventManager) {
  // Get account repository
  const accountRepository = getAccountRepository();
  const balanceRepository = getBalanceRepository();
  const movementRepository = getMovementRepository();
  const ledgerLogRepository = getLedgerLogRepository();

  // Get complete movement use case
  const completeMovementUseCase = new CompleteMovementUseCase(
    accountRepository,
    balanceRepository,
    movementRepository,
    eventManager,
  );

  // Subscribe to movement events with ledger logging
  const ledgerHandler = new LedgerLogHandler(ledgerLogRepository);
  const movementCreatedHandler = new MovementCreatedHandler(
    completeMovementUseCase,
  );

  // Subscribe to all movement events (using wildcard routing)
  await eventManager.subscribe(MovementEventType.ALL, ledgerHandler, {
    queue: 'ledger.all.movements',
    routingKey: MovementEventType.ALL,
  });

  // Subscribe to movement created events
  await eventManager.subscribe(
    MovementEventType.CREATED,
    movementCreatedHandler,
    {
      queue: 'ledger.movement.created',
      routingKey: MovementEventType.CREATED,
    },
  );

  // Start consuming messages
  await eventManager.startConsumer();
}
