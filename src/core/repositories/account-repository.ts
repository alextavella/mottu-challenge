import {
  CreateAccountData,
  IAccountRepository,
} from '@/domain/contracts/repositories/account-repository';
import { AccountData, accountSchema } from '@/domain/entities/account.entity';
import { PrismaClient } from '@prisma/client';

export class AccountRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}
  updateBalance(): Promise<{
    id: string;
    name: string;
    document: string;
    email: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
  }> {
    throw new Error('Method not implemented.');
  }

  async create(data: CreateAccountData): Promise<AccountData> {
    return await this.prisma.account
      .create({
        data: {
          name: data.name,
          document: data.document,
          email: data.email,
          balance: 1000, // Default balance is 1000
        },
      })
      .then((account) => accountSchema.parse(account));
  }

  async findById(id: string): Promise<AccountData | null> {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    return account ? accountSchema.parse(account) : null;
  }

  async findByDocumentOrEmail(
    document: string,
    email: string,
  ): Promise<AccountData | null> {
    const account = await this.prisma.account.findFirst({
      where: {
        OR: [{ document }, { email }],
      },
    });

    return account ? accountSchema.parse(account) : null;
  }

  async getBalance(id: string): Promise<number | null> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { balance: true },
    });

    return account ? accountSchema.parse(account).balance : null;
  }
}
