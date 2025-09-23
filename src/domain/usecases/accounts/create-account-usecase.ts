import prisma from '@/database/client';
import { BusinessError } from '@/domain/errors/business-error';
import { throwServerError } from '@/domain/errors/server-error';
import { getEventManager } from '@/lib/events';
import { EventFactory } from '@/message';
import { AccountEventType } from '@/message/events/account-event';
import { IUseCase } from '../interfaces';

type Input = {
  name: string;
  document: string;
  email: string;
};

type Output = {
  accountId: string;
};

export class CreateAccountUseCase implements IUseCase<Input, Output> {
  async execute(input: Input): Promise<Output> {
    const { name, document, email } = input;

    const accountExists = await prisma.account.findFirst({
      where: {
        OR: [{ document }, { email }],
      },
    });

    if (!!accountExists) {
      throw new BusinessError('Account already exists');
    }

    const account = await prisma.account
      .create({
        data: {
          name,
          document,
          email,
        },
      })
      .catch(throwServerError('Failed to create account'));

    const event = EventFactory.createAccountEvent(
      AccountEventType.CREATED,
      account,
    );

    const eventManager = getEventManager();
    await eventManager
      .publish(event)
      .catch(throwServerError('Failed to publish account event'));

    return {
      accountId: account.id,
    };
  }
}
