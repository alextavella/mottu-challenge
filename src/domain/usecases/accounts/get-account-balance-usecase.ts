import prisma from '@/database/client';
import { BusinessError } from '@/domain/errors/business-error';
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
  async execute(input: Input): Promise<Output> {
    const { accountId } = input;

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

    return {
      accountId: account.id,
      name: account.name,
      balance: account.balance.toNumber(),
    };
  }
}
