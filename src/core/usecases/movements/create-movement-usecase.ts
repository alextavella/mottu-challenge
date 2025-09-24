import { EventFactory } from '@/core/events';
import { MovementEventType } from '@/core/events/movement-event';
import { IAccountRepository } from '@/domain/contracts/repositories/account-repository';
import { IMovementRepository } from '@/domain/contracts/repositories/movement-repository';
import { IUseCase } from '@/domain/contracts/usecases/interfaces';
import { UpdateAccountBalance } from '@/domain/entities/account-balance.entity';
import { CreateMovementData } from '@/domain/entities/movement.entity';
import { AccountNotFoundError } from '@/domain/errors/account.errors';
import { throwServerError } from '@/domain/errors/server.error';
import { IEventManager } from '@/infra/events/types';

type Input = CreateMovementData;
type Output = {
  movementId: string;
};

export type ICreateMovementUseCase = IUseCase<Input, Output>;

export class CreateMovementUseCase implements ICreateMovementUseCase {
  constructor(
    private readonly movementRepository: IMovementRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly eventManager: IEventManager,
  ) {}

  async execute(input: Input): Promise<Output> {
    const { accountId, amount, type, description } = input;

    // Find the account
    const account = await this.accountRepository
      .findById(accountId)
      .catch(() => null);

    if (!account) {
      throw new AccountNotFoundError(accountId);
    }

    // Update the account balance
    const updateAccountBalance = new UpdateAccountBalance(account, {
      amount,
      type,
    });

    // Validate the account balance
    updateAccountBalance.validate();

    // Create the movement
    const movement = await this.movementRepository
      .create({
        accountId,
        amount,
        type,
        description,
      })
      .catch(throwServerError('Failed to create movement'));

    // Publish event
    const event = EventFactory.createMovementEvent(
      MovementEventType.CREATED,
      movement,
    );

    await this.eventManager
      .publish(event)
      .catch(throwServerError('Failed to publish movement event:'));

    return {
      movementId: movement.id,
    };
  }
}
