import { EventFactory } from '@/core/events';
import { AccountEventType } from '@/core/events/account-event';
import { IAccountRepository } from '@/domain/contracts/repositories/account-repository';
import { IUseCase } from '@/domain/contracts/usecases/interfaces';
import { CreateAccountData } from '@/domain/entities/account.entity';
import { BusinessRuleViolationError } from '@/domain/errors/account.errors';
import { throwServerError } from '@/domain/errors/server.error';
import { IEventManager } from '@/infra/events/types';

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

    // Check if account already exists
    const accountExists = await this.accountRepository
      .findByDocumentOrEmail(document, email)
      .catch(throwServerError('Failed to find account by document or email'));

    if (accountExists) {
      throw new BusinessRuleViolationError(
        'Account already exists with this document or email',
      );
    }

    // Create the account
    const account = await this.accountRepository
      .create({
        name,
        document,
        email,
      })
      .catch(throwServerError('Failed to create account'));

    // Publish event
    const event = EventFactory.createAccountEvent(
      AccountEventType.CREATED,
      account,
    );

    this.eventManager.publish(event);

    return {
      accountId: account.id,
    };
  }
}
