import { AccountEventType } from '@/message/events/account-event';
import { MovementEventType } from '@/message/events/movement-event';

describe('Event Types', () => {
  describe('MovementEventType', () => {
    it('should have correct event types', () => {
      expect(MovementEventType.ALL).toBe('movement.*');
      expect(MovementEventType.CREATED).toBe('movement.created');
      expect(MovementEventType.UPDATED).toBe('movement.updated');
      expect(MovementEventType.DELETED).toBe('movement.deleted');
    });
  });

  describe('AccountEventType', () => {
    it('should have correct event types', () => {
      expect(AccountEventType.ALL).toBe('account.*');
      expect(AccountEventType.CREATED).toBe('account.created');
      expect(AccountEventType.UPDATED).toBe('account.updated');
      expect(AccountEventType.BALANCE_UPDATED).toBe('account.balance_updated');
    });
  });
});
