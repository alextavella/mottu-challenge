import { BusinessError } from '@/domain/errors/business-error';
import { ServerError } from '@/domain/errors/server-error';
import { AccountRepository } from '@/domain/repositories';
import { IUseCase } from '../interfaces';

type Input = {
  accountId: string;
};

type Output = {
  accountId: string;
  name: string;
  balance: number;
};

export class GetAccountBalanceUseCase implements IUseCase<Input, Output> {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: Input): Promise<Output> {
    const { accountId } = input;

    try {
      const account = await this.accountRepository.findById(accountId);

      if (!account) {
        throw new BusinessError('Account not found');
      }

      return {
        accountId: account.id,
        name: account.name,
        balance: account.balance.toNumber(),
      };
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new ServerError('Failed to get account balance', error as Error);
    }
  }
}
