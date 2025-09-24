import { BaseEvent } from '@/infra/events/types';
import { AccountData } from '../../domain/entities/account.entity';

export enum AccountEventType {
  ALL = 'account.*',
  CREATED = 'account.created',
  UPDATED = 'account.updated',
  BALANCE_UPDATED = 'account.balance_updated',
}

export type AccountEvent = BaseEvent<AccountEventType> & {
  data: AccountData;
};

export function createAccountEvent(
  type: AccountEventType,
  data: AccountData,
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
