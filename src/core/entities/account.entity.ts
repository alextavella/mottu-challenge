export { Account } from '@prisma/client';

export type CreateAccountData = {
  name: string;
  document: string;
  email: string;
};
