import { Account } from '@prisma/client';
import { BaseEvent } from '../../lib/events/types';

export enum AccountEventType {
  ALL = 'account.*',
  CREATED = 'account.created',
  UPDATED = 'account.updated',
  BALANCE_UPDATED = 'account.balance_updated',
}

export interface AccountEvent extends BaseEvent {
  type: AccountEventType;
  data: Account;
}

export function createAccountEvent(
  type: AccountEventType,
  data: Account,
  correlationId?: string,
) {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date(),
    version: '1.0',
    correlationId,
    data,
  };
}
