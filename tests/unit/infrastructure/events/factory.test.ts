import { AccountEventType } from '@/infrastructure/events/events/account-event';
import { MovementEventType } from '@/infrastructure/events/events/movement-event';
import { EventFactory } from '@/infrastructure/events/index';
import { Prisma } from '@prisma/client';

describe('EventFactory', () => {
  describe('createMovementEvent', () => {
    it('should create a movement event with all required fields', () => {
      const movementData = {
        id: 'mov-123',
        accountId: 'acc-456',
        amount: new Prisma.Decimal(100.5),
        type: 'CREDIT' as const,
        description: 'Test movement',
        createdAt: new Date('2023-01-01T10:00:00Z'),
      };

      const event = EventFactory.createMovementEvent(
        MovementEventType.CREATED,
        movementData,
        'correlation-123',
      );

      expect(event.id).toBeDefined();
      expect(event.type).toBe(MovementEventType.CREATED);
      expect(event.data).toEqual(movementData);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.correlationId).toBe('correlation-123');
    });

    it('should create a movement event without correlation ID', () => {
      const movementData = {
        id: 'mov-123',
        accountId: 'acc-456',
        amount: new Prisma.Decimal(50.25),
        type: 'DEBIT' as const,
        description: 'ATM withdrawal',
        createdAt: new Date('2023-01-01T10:00:00Z'),
      };

      const event = EventFactory.createMovementEvent(
        MovementEventType.UPDATED,
        movementData,
      );

      expect(event.id).toBeDefined();
      expect(event.type).toBe(MovementEventType.UPDATED);
      expect(event.data).toEqual(movementData);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.correlationId).toBeUndefined();
    });

    it('should generate unique IDs for different events', () => {
      const movementData = {
        id: 'mov-123',
        accountId: 'acc-456',
        amount: new Prisma.Decimal(100),
        type: 'CREDIT' as const,
        description: 'Test',
        createdAt: new Date(),
      };

      const event1 = EventFactory.createMovementEvent(
        MovementEventType.CREATED,
        movementData,
      );
      const event2 = EventFactory.createMovementEvent(
        MovementEventType.CREATED,
        movementData,
      );

      expect(event1.id).not.toBe(event2.id);
    });

    it('should handle different movement types', () => {
      const movementData = {
        id: 'mov-123',
        accountId: 'acc-456',
        amount: new Prisma.Decimal(75),
        type: 'DEBIT' as const,
        description: 'Purchase',
        createdAt: new Date(),
      };

      const createdEvent = EventFactory.createMovementEvent(
        MovementEventType.CREATED,
        movementData,
      );
      const updatedEvent = EventFactory.createMovementEvent(
        MovementEventType.UPDATED,
        movementData,
      );
      const deletedEvent = EventFactory.createMovementEvent(
        MovementEventType.DELETED,
        movementData,
      );

      expect(createdEvent.type).toBe(MovementEventType.CREATED);
      expect(updatedEvent.type).toBe(MovementEventType.UPDATED);
      expect(deletedEvent.type).toBe(MovementEventType.DELETED);
    });
  });

  describe('createAccountEvent', () => {
    it('should create an account event with all required fields', () => {
      const accountData = {
        id: 'acc-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(1500.75),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const event = EventFactory.createAccountEvent(
        AccountEventType.CREATED,
        accountData,
        'correlation-456',
      );

      expect(event.id).toBeDefined();
      expect(event.type).toBe(AccountEventType.CREATED);
      expect(event.data).toEqual(accountData);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.correlationId).toBe('correlation-456');
    });

    it('should create an account event without correlation ID', () => {
      const accountData = {
        id: 'acc-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(2000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const event = EventFactory.createAccountEvent(
        AccountEventType.BALANCE_UPDATED,
        accountData,
      );

      expect(event.id).toBeDefined();
      expect(event.type).toBe(AccountEventType.BALANCE_UPDATED);
      expect(event.data).toEqual(accountData);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.correlationId).toBeUndefined();
    });

    it('should generate unique IDs for different account events', () => {
      const accountData = {
        id: 'acc-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const event1 = EventFactory.createAccountEvent(
        AccountEventType.CREATED,
        accountData,
      );
      const event2 = EventFactory.createAccountEvent(
        AccountEventType.CREATED,
        accountData,
      );

      expect(event1.id).not.toBe(event2.id);
    });

    it('should handle different account event types', () => {
      const accountData = {
        id: 'acc-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(500),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdEvent = EventFactory.createAccountEvent(
        AccountEventType.CREATED,
        accountData,
      );
      const updatedEvent = EventFactory.createAccountEvent(
        AccountEventType.UPDATED,
        accountData,
      );
      const balanceUpdatedEvent = EventFactory.createAccountEvent(
        AccountEventType.BALANCE_UPDATED,
        accountData,
      );

      expect(createdEvent.type).toBe(AccountEventType.CREATED);
      expect(updatedEvent.type).toBe(AccountEventType.UPDATED);
      expect(balanceUpdatedEvent.type).toBe(AccountEventType.BALANCE_UPDATED);
    });

    it('should handle zero balance', () => {
      const accountData = {
        id: 'acc-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const event = EventFactory.createAccountEvent(
        AccountEventType.CREATED,
        accountData,
      );

      expect(event.data.balance).toEqual(new Prisma.Decimal(0));
    });

    it('should handle negative balance', () => {
      const accountData = {
        id: 'acc-123',
        name: 'John Doe',
        email: 'john@example.com',
        document: '12345678901',
        balance: new Prisma.Decimal(-100.5),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const event = EventFactory.createAccountEvent(
        AccountEventType.BALANCE_UPDATED,
        accountData,
      );

      expect(event.data.balance).toEqual(new Prisma.Decimal(-100.5));
    });
  });

  describe('timestamp consistency', () => {
    it('should create timestamps close to current time', () => {
      const beforeCreate = new Date();

      const movementData = {
        id: 'mov-123',
        accountId: 'acc-456',
        amount: new Prisma.Decimal(100),
        type: 'CREDIT' as const,
        description: 'Test',
        createdAt: new Date(),
      };

      const event = EventFactory.createMovementEvent(
        MovementEventType.CREATED,
        movementData,
      );

      const afterCreate = new Date();

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });
  });
});
