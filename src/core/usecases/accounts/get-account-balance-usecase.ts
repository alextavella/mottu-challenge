import { IAccountRepository } from '@/core/contracts/repositories/account-repository';
import { AccountNotFoundError } from '@/core/errors/account.errors';
import { ServerError } from '@/core/errors/server.error';
import { IUseCase } from '../../contracts/usecases/interfaces';

type Input = {
  accountId: string;
};
type Output = {
  accountId: string;
  name: string;
  balance: number;
};

export class GetAccountBalanceUseCase implements IUseCase<Input, Output> {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(input: Input): Promise<Output> {
    const { accountId } = input;

    try {
      const account = await this.accountRepository.findById(accountId);

      if (!account) {
        throw new AccountNotFoundError(accountId);
      }

      return {
        accountId: account.id,
        name: account.name,
        balance: account.balance.toNumber(),
      };
    } catch (error) {
      if (error instanceof AccountNotFoundError) {
        throw error;
      }
      throw new ServerError('Failed to get account balance', error as Error);
    }
  }
}
