import { EventFactory } from '@/core/events';
import { AccountEventType } from '@/core/events/account-event';
import { MovementEventType } from '@/core/events/movement-event';
import { IAccountRepository } from '@/domain/contracts/repositories/account-repository';
import { IBalanceRepository } from '@/domain/contracts/repositories/balance-repository';
import { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';
import { IUseCase } from '@/domain/contracts/usecases/interfaces';
import { UpdateAccountBalance } from '@/domain/entities/account-balance.entity';
import { AccountNotFoundError } from '@/domain/errors/account.errors';
import { MovementNotFoundError } from '@/domain/errors/movement.errors';
import { throwServerError } from '@/domain/errors/server.error';
import { IEventManager } from '@/infra/events/types';
import { MovementStatus } from '@prisma/client';

type Input = {
  movementId: string;
};
type Output = {
  movementId: string;
  status: MovementStatus;
};

export type ICompleteMovementUseCase = IUseCase<Input, Output>;

export class CompleteMovementUseCase implements ICompleteMovementUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly balanceRepository: IBalanceRepository,
    private readonly movementRepository: IMovementRepository,
    private readonly eventManager: IEventManager,
  ) {}

  async execute(input: Input): Promise<Output> {
    const { movementId } = input;

    // Find the movement
    const movement = await this.movementRepository
      .findById(movementId)
      .catch(() => null);

    if (!movement) {
      throw new MovementNotFoundError(movementId);
    }

    // Find the account
    const account = await this.accountRepository
      .findById(movement.accountId)
      .catch(() => null);

    if (!account) {
      throw new AccountNotFoundError(movement.accountId);
    }

    // Update the account balance
    const updateAccountBalance = new UpdateAccountBalance(account, {
      amount: movement.amount,
      type: movement.type,
    });

    // Validate the account balance
    updateAccountBalance.validate();

    // Perform the account balance update
    const updatedAccount = await updateAccountBalance.perform();

    const updatedMovement = await this.balanceRepository.updateBalance(
      movement,
      updatedAccount.balance,
    );

    // Publish events
    const accountEvent = EventFactory.createAccountEvent(
      AccountEventType.BALANCE_UPDATED,
      updatedAccount,
    );

    const movementEvent = EventFactory.createMovementEvent(
      MovementEventType.UPDATED,
      updatedMovement,
    );

    this.eventManager
      .publishBatch([accountEvent, movementEvent])
      .catch(throwServerError('Failed to publish account event:'));

    return {
      movementId: updatedMovement.id,
      status: updatedMovement.status,
    };
  }
}
