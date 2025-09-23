import {
  CreateAccountData,
  IAccountRepository,
} from '@/core/contracts/repositories/account-repository';
import { Account, Prisma, PrismaClient } from '@prisma/client';

export class AccountRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateAccountData): Promise<Account> {
    return await this.prisma.account.create({
      data: {
        name: data.name,
        document: data.document,
        email: data.email,
        balance: new Prisma.Decimal(1000), // Default balance is 1000
      },
    });
  }

  async findById(id: string): Promise<Account | null> {
    return await this.prisma.account.findUnique({
      where: { id },
    });
  }

  async findByDocumentOrEmail(
    document: string,
    email: string,
  ): Promise<Account | null> {
    return await this.prisma.account.findFirst({
      where: {
        OR: [{ document }, { email }],
      },
    });
  }

  async updateBalance(id: string, balance: Prisma.Decimal): Promise<Account> {
    return await this.prisma.account.update({
      where: { id },
      data: { balance },
    });
  }

  async getBalance(id: string): Promise<Prisma.Decimal | null> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { balance: true },
    });

    return account?.balance ?? null;
  }
}
