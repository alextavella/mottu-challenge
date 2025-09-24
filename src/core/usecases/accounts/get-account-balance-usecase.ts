import { IAccountRepository } from '@/domain/contracts/repositories/account-repository';
import { IUseCase } from '@/domain/contracts/usecases/interfaces';
import { AccountNotFoundError } from '@/domain/errors/account.errors';

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

    const account = await this.accountRepository
      .findById(accountId)
      .catch(() => null);

    if (!account) {
      throw new AccountNotFoundError(accountId);
    }

    return {
      accountId: account.id,
      name: account.name,
      balance: Number(account.balance),
    };
  }
}
