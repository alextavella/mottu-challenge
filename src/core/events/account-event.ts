import { BaseEvent } from '@/infrastructure/events/types';
import { Account } from '@prisma/client';

export enum AccountEventType {
  ALL = 'account.*',
  CREATED = 'account.created',
  UPDATED = 'account.updated',
  BALANCE_UPDATED = 'account.balance_updated',
}

export type AccountEvent = BaseEvent<AccountEventType> & {
  data: Account;
};

export function createAccountEvent(
  type: AccountEventType,
  data: Account,
  correlationId?: string,
): AccountEvent {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date(),
    version: '1.0',
    correlationId,
    data,
  };
}
