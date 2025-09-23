import { Account, Prisma } from '@prisma/client';

export interface AccountRepository {
  create(data: CreateAccountData): Promise<Account>;
  findById(id: string): Promise<Account | null>;
  findByDocumentOrEmail(
    document: string,
    email: string,
  ): Promise<Account | null>;
  updateBalance(id: string, balance: Prisma.Decimal): Promise<Account>;
  getBalance(id: string): Promise<Prisma.Decimal | null>;
}

export type CreateAccountData = {
  name: string;
  document: string;
  email: string;
};
