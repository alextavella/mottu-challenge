import { IAccountRepository } from '@/core/contracts/repositories/account-repository';
import { IMovementRepository } from '@/core/contracts/repositories/movement-repository';
import { AccountNotFoundError } from '@/core/errors/account.errors';
import { InsufficientFundsError } from '@/core/errors/movement.errors';
import { ServerError } from '@/core/errors/server.error';
import { getEventManager } from '@/infrastructure/events/event-manager';
import { MovementEventType } from '@/infrastructure/events/events/movement-event';
import { EventFactory } from '@/infrastructure/events/index';
import { IUseCase } from '../interfaces';

type Input = {
  accountId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description?: string;
};

type Output = {
  movementId: string;
};

export class CreateMovementUseCase implements IUseCase<Input, Output> {
  constructor(
    private readonly movementRepository: IMovementRepository,
    private readonly accountRepository: IAccountRepository,
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
      if (type === 'DEBIT' && account.balance.toNumber() < amount) {
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
        type === 'CREDIT'
          ? account.balance.add(amount)
          : account.balance.sub(amount);

      await this.accountRepository.updateBalance(accountId, newBalance);

      // Publish event
      const event = EventFactory.createMovementEvent(
        MovementEventType.CREATED,
        movement,
      );

      const eventManager = getEventManager();
      await eventManager.publish(event).catch((error) => {
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
