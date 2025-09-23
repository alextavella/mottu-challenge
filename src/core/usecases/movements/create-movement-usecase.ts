import { IAccountRepository } from '@/core/contracts/repositories/account-repository';
import { IMovementRepository } from '@/core/contracts/repositories/movement-repository';
import {
  CreateMovementData,
  MovementType,
} from '@/core/entities/movement.entity';
import { AccountNotFoundError } from '@/core/errors/account.errors';
import { InsufficientFundsError } from '@/core/errors/movement.errors';
import { ServerError } from '@/core/errors/server.error';
import { MovementEventType } from '@/core/events/movement-event';
import { EventFactory } from '@/infrastructure/events/index';
import { IEventManager } from '@/infrastructure/events/types';
import { IUseCase } from '../../contracts/usecases/interfaces';

type Input = CreateMovementData;
type Output = {
  movementId: string;
};

export class CreateMovementUseCase implements IUseCase<Input, Output> {
  constructor(
    private readonly movementRepository: IMovementRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly eventManager: IEventManager,
  ) {}

  async execute(input: Input): Promise<Output> {
    const { accountId, amount, type, description } = input;

    try {
      // Find the account
      const account = await this.accountRepository.findById(accountId);

      if (!account) {
        throw new AccountNotFoundError(accountId);
      }

      // Check if there's sufficient balance for debit operations
      if (type === MovementType.DEBIT && account.balance.toNumber() < amount) {
        throw new InsufficientFundsError(
          accountId,
          amount,
          account.balance.toNumber(),
        );
      }

      // Create the movement
      const movement = await this.movementRepository.create({
        accountId,
        amount,
        type,
        description,
      });

      // Update account balance
      const newBalance =
        type === MovementType.CREDIT
          ? account.balance.add(amount)
          : account.balance.sub(amount);

      await this.accountRepository.updateBalance(accountId, newBalance);

      // Publish event
      const event = EventFactory.createMovementEvent(
        MovementEventType.CREATED,
        movement,
      );

      await this.eventManager.publish(event).catch((error) => {
        console.error('Failed to publish movement event:', error);
        // Don't fail the operation if event publishing fails
      });

      return {
        movementId: movement.id,
      };
    } catch (error) {
      if (
        error instanceof AccountNotFoundError ||
        error instanceof InsufficientFundsError
      ) {
        throw error;
      }
      throw new ServerError('Failed to create movement', error as Error);
    }
  }
}
