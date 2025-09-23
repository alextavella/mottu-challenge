import { IAccountRepository } from '@/core/contracts/repositories/account-repository';
import { BusinessRuleViolationError } from '@/core/errors/account.errors';
import { ServerError } from '@/core/errors/server.error';
import { getEventManager } from '@/infrastructure/events/event-manager';
import { AccountEventType } from '@/infrastructure/events/events/account-event';
import { EventFactory } from '@/infrastructure/events/index';
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
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(input: Input): Promise<Output> {
    const { name, document, email } = input;

    try {
      // Check if account already exists
      const accountExists = await this.accountRepository.findByDocumentOrEmail(
        document,
        email,
      );

      if (accountExists) {
        throw new BusinessRuleViolationError(
          'Account already exists with this document or email',
        );
      }

      // Create the account
      const account = await this.accountRepository.create({
        name,
        document,
        email,
      });

      // Publish event
      const event = EventFactory.createAccountEvent(
        AccountEventType.CREATED,
        account,
      );

      const eventManager = getEventManager();
      await eventManager.publish(event).catch((error) => {
        console.error('Failed to publish account event:', error);
        // Don't fail the operation if event publishing fails
      });

      return {
        accountId: account.id,
      };
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new ServerError('Failed to create account', error as Error);
    }
  }
}
