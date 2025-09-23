import { BusinessError } from '@/domain/errors/business-error';
import { ServerError } from '@/domain/errors/server-error';
import { AccountRepository, MovementRepository } from '@/domain/repositories';
import { getEventManager } from '@/lib/events';
import { EventFactory } from '@/message';
import { MovementEventType } from '@/message/events/movement-event';
import { Prisma } from '@prisma/client';
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
    private readonly movementRepository: MovementRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const { accountId, amount, type, description } = input;

    try {
      // Find the account
      const account = await this.accountRepository.findById(accountId);

      if (!account) {
        throw new BusinessError('Account not found');
      }

      // Check if there's sufficient balance for debit operations
      if (type === 'DEBIT' && account.balance.toNumber() < amount) {
        throw new BusinessError('Insufficient balance');
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
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new ServerError('Failed to create movement', error as Error);
    }
  }
}
