import { IAccountRepository } from '@/core/contracts/repositories/account-repository';
import { CreateAccountData } from '@/core/entities/account.entity';
import { BusinessRuleViolationError } from '@/core/errors/account.errors';
import { ServerError } from '@/core/errors/server.error';
import { AccountEventType } from '@/core/events/account-event';
import { EventFactory } from '@/infrastructure/events/index';
import { IEventManager } from '@/infrastructure/events/types';
import { IUseCase } from '../../contracts/usecases/interfaces';

type Input = CreateAccountData;
type Output = {
  accountId: string;
};

export class CreateAccountUseCase implements IUseCase<Input, Output> {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly eventManager: IEventManager,
  ) {}

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

      await this.eventManager.publish(event).catch((error) => {
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
