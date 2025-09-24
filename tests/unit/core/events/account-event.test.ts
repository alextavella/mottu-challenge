import {
  AccountEvent,
  AccountEventType,
  createAccountEvent,
} from '@/core/events/account-event';
import { AccountData } from '@/domain/entities/account.entity';

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn().mockReturnValue(mockUUID),
});

describe('AccountEvent', () => {
  const mockAccountData: AccountData = {
    id: 'account-id',
    name: 'Test Account',
    document: '12345678901',
    email: 'test@example.com',
    balance: 1000.5,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  describe('createAccountEvent', () => {
    it('should create an account created event', () => {
      const event = createAccountEvent(
        AccountEventType.CREATED,
        mockAccountData,
      );

      expect(event).toEqual({
        id: mockUUID,
        type: AccountEventType.CREATED,
        timestamp: expect.any(Date),
        version: '1.0',
        correlationId: undefined,
        data: mockAccountData,
      });

      expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    });

    it('should create an account updated event', () => {
      const event = createAccountEvent(
        AccountEventType.UPDATED,
        mockAccountData,
      );

      expect(event.type).toBe(AccountEventType.UPDATED);
      expect(event.data).toBe(mockAccountData);
    });

    it('should create a balance updated event', () => {
      const event = createAccountEvent(
        AccountEventType.BALANCE_UPDATED,
        mockAccountData,
      );

      expect(event.type).toBe(AccountEventType.BALANCE_UPDATED);
      expect(event.data).toBe(mockAccountData);
    });

    it('should create an all events wildcard event', () => {
      const event = createAccountEvent(AccountEventType.ALL, mockAccountData);

      expect(event.type).toBe(AccountEventType.ALL);
      expect(event.data).toBe(mockAccountData);
    });

    it('should include correlation ID when provided', () => {
      const correlationId = 'correlation-123';
      const event = createAccountEvent(
        AccountEventType.CREATED,
        mockAccountData,
        correlationId,
      );

      expect(event.correlationId).toBe(correlationId);
    });

    it('should not include correlation ID when not provided', () => {
      const event = createAccountEvent(
        AccountEventType.CREATED,
        mockAccountData,
      );

      expect(event.correlationId).toBeUndefined();
    });

    it('should set timestamp to current date', () => {
      const beforeCreate = new Date();
      const event = createAccountEvent(
        AccountEventType.CREATED,
        mockAccountData,
      );
      const afterCreate = new Date();

      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });

    it('should set version to 1.0', () => {
      const event = createAccountEvent(
        AccountEventType.CREATED,
        mockAccountData,
      );

      expect(event.version).toBe('1.0');
    });

    it('should handle different account data', () => {
      const differentAccountData: AccountData = {
        id: 'different-account-id',
        name: 'Different Account',
        document: '98765432109',
        email: 'different@example.com',
        balance: 2500.75,
        createdAt: new Date('2023-06-15T10:30:00Z'),
        updatedAt: new Date('2023-06-15T10:30:00Z'),
      };

      const event = createAccountEvent(
        AccountEventType.CREATED,
        differentAccountData,
      );

      expect(event.data).toBe(differentAccountData);
      expect(event.data.id).toBe('different-account-id');
      expect(event.data.balance).toBe(2500.75);
    });

    it('should handle zero balance account', () => {
      const zeroBalanceAccount: AccountData = {
        ...mockAccountData,
        balance: 0,
      };

      const event = createAccountEvent(
        AccountEventType.CREATED,
        zeroBalanceAccount,
      );

      expect(event.data.balance).toBe(0);
    });

    it('should handle negative balance account', () => {
      const negativeBalanceAccount: AccountData = {
        ...mockAccountData,
        balance: -100.25,
      };

      const event = createAccountEvent(
        AccountEventType.CREATED,
        negativeBalanceAccount,
      );

      expect(event.data.balance).toBe(-100.25);
    });

    it('should generate unique IDs for multiple events', () => {
      const uuid1 = 'uuid-1';
      const uuid2 = 'uuid-2';

      (crypto.randomUUID as any)
        .mockReturnValueOnce(uuid1)
        .mockReturnValueOnce(uuid2);

      const event1 = createAccountEvent(
        AccountEventType.CREATED,
        mockAccountData,
      );
      const event2 = createAccountEvent(
        AccountEventType.UPDATED,
        mockAccountData,
      );

      expect(event1.id).toBe(uuid1);
      expect(event2.id).toBe(uuid2);
      expect(event1.id).not.toBe(event2.id);
    });
  });

  describe('AccountEventType enum', () => {
    it('should have correct values', () => {
      expect(AccountEventType.ALL).toBe('account.*');
      expect(AccountEventType.CREATED).toBe('account.created');
      expect(AccountEventType.UPDATED).toBe('account.updated');
      expect(AccountEventType.BALANCE_UPDATED).toBe('account.balance_updated');
    });
  });

  describe('AccountEvent type', () => {
    it('should have correct structure', () => {
      const event: AccountEvent = {
        id: 'test-id',
        type: AccountEventType.CREATED,
        timestamp: new Date(),
        version: '1.0',
        correlationId: 'test-correlation',
        data: mockAccountData,
      };

      expect(event.id).toBe('test-id');
      expect(event.type).toBe(AccountEventType.CREATED);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.version).toBe('1.0');
      expect(event.correlationId).toBe('test-correlation');
      expect(event.data).toBe(mockAccountData);
    });
  });
});
