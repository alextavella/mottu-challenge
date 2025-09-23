import prisma from '@/database/client';
import { BusinessError } from '@/domain/errors/business-error';
import { throwServerError } from '@/domain/errors/server-error';
import { getEventManager } from '@/lib/events';
import { EventFactory } from '@/message';
import { MovementEventType } from '@/message/events/movement-event';
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
  async execute(input: Input): Promise<Output> {
    const { accountId, amount, type, description } = input;

    const account = await prisma.account
      .findUnique({
        where: {
          id: accountId,
        },
      })
      .catch(() => null);

    if (!account) {
      throw new BusinessError('Account not found');
    }

    if (type === 'DEBIT' && account.balance.toNumber() < amount) {
      throw new BusinessError('Insufficient balance');
    }

    const movement = await prisma.movement
      .create({
        data: {
          accountId,
          amount,
          type,
          description,
        },
      })
      .catch(throwServerError('Failed to create movement'));

    await prisma.account
      .update({
        where: {
          id: accountId,
        },
        data: {
          balance:
            type === 'CREDIT'
              ? account.balance.add(amount)
              : account.balance.sub(amount),
        },
      })
      .catch(throwServerError('Failed to update balance'));

    const event = EventFactory.createMovementEvent(
      MovementEventType.CREATED,
      movement,
    );

    const eventManager = getEventManager();
    await eventManager
      .publish(event)
      .catch(throwServerError('Failed to publish movement event'));

    return {
      movementId: movement.id,
    };
  }
}
