import { RepositoryContainer } from '@/infra/container/repository.container';
import { IEventManager } from '@/infra/events/types';
import { CreateAccountUseCase } from '../accounts/create-account-usecase';
import { GetAccountBalanceUseCase } from '../accounts/get-account-balance-usecase';
import { CreateLedgerLogUseCase } from '../ledger-log/create-ledger-log-usecase';
import { CancelMovementUseCase } from '../movements/cancel-movement-usecase';
import { CompleteMovementUseCase } from '../movements/complete-movement-usecase';
import { CreateMovementUseCase } from '../movements/create-movement-usecase';

export class UseCaseContainer {
  private static instance: UseCaseContainer;
  private readonly repositoryContainer: RepositoryContainer;

  constructor(private readonly eventManager: IEventManager) {
    this.repositoryContainer = RepositoryContainer.getInstance();
  }

  static getInstance(eventManager: IEventManager): UseCaseContainer {
    if (!UseCaseContainer.instance) {
      UseCaseContainer.instance = new UseCaseContainer(eventManager);
    }
    return UseCaseContainer.instance;
  }

  getCreateAccountUsecase() {
    return new CreateAccountUseCase(
      this.repositoryContainer.getAccountRepository(),
      this.eventManager,
    );
  }

  getGetAccountBalanceUseCase() {
    return new GetAccountBalanceUseCase(
      this.repositoryContainer.getAccountRepository(),
    );
  }

  getCreateMovementUsecase() {
    return new CreateMovementUseCase(
      this.repositoryContainer.getAccountRepository(),
      this.repositoryContainer.getMovementRepository(),
      this.eventManager,
    );
  }

  getCancelMovementUsecase() {
    return new CancelMovementUseCase(
      this.repositoryContainer.getMovementRepository(),
      this.eventManager,
    );
  }

  getCompleteMovementUsecase() {
    return new CompleteMovementUseCase(
      this.repositoryContainer.getAccountRepository(),
      this.repositoryContainer.getBalanceRepository(),
      this.repositoryContainer.getMovementRepository(),
      this.eventManager,
    );
  }

  getCreateLedgerLogUsecase() {
    return new CreateLedgerLogUseCase(
      this.repositoryContainer.getLedgerLogRepository(),
    );
  }
}
