import { AccountData } from '@/domain/entities/account.entity';

export interface IAccountRepository {
  create(data: CreateAccountData): Promise<AccountData>;
  findById(id: string): Promise<AccountData | null>;
  findByDocumentOrEmail(
    document: string,
    email: string,
  ): Promise<AccountData | null>;
  getBalance(id: string): Promise<number | null>;
}

export type CreateAccountData = {
  name: string;
  document: string;
  email: string;
};
