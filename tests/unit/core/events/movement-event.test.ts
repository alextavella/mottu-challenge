import {
  MovementEvent,
  MovementEventType,
  createMovementEvent,
} from '@/core/events/movement-event';
import { MovementData } from '@/domain/entities/movement.entity';
import { MovementStatus, MovementType } from '@prisma/client';

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn().mockReturnValue(mockUUID),
});

describe('MovementEvent', () => {
  const mockMovementData: MovementData = {
    id: 'movement-id',
    accountId: 'account-id',
    amount: 100.5,
    type: MovementType.CREDIT,
    description: 'Test movement',
    status: MovementStatus.PENDING,
    createdAt: new Date('2023-01-01T00:00:00Z'),
  };

  describe('createMovementEvent', () => {
    it('should create a movement created event', () => {
      const event = createMovementEvent(
        MovementEventType.CREATED,
        mockMovementData,
      );

      expect(event).toEqual({
        id: mockUUID,
        type: MovementEventType.CREATED,
        timestamp: expect.any(Date),
        version: '1.0',
        correlationId: undefined,
        data: mockMovementData,
      });

      expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    });

    it('should create a movement updated event', () => {
      const event = createMovementEvent(
        MovementEventType.UPDATED,
        mockMovementData,
      );

      expect(event.type).toBe(MovementEventType.UPDATED);
      expect(event.data).toBe(mockMovementData);
    });

    it('should create a movement cancelled event', () => {
      const event = createMovementEvent(
        MovementEventType.CANCELLED,
        mockMovementData,
      );

      expect(event.type).toBe(MovementEventType.CANCELLED);
      expect(event.data).toBe(mockMovementData);
    });

    it('should create an all events wildcard event', () => {
      const event = createMovementEvent(
        MovementEventType.ALL,
        mockMovementData,
      );

      expect(event.type).toBe(MovementEventType.ALL);
      expect(event.data).toBe(mockMovementData);
    });

    it('should include correlation ID when provided', () => {
      const correlationId = 'correlation-123';
      const event = createMovementEvent(
        MovementEventType.CREATED,
        mockMovementData,
        correlationId,
      );

      expect(event.correlationId).toBe(correlationId);
    });

    it('should not include correlation ID when not provided', () => {
      const event = createMovementEvent(
        MovementEventType.CREATED,
        mockMovementData,
      );

      expect(event.correlationId).toBeUndefined();
    });

    it('should set timestamp to current date', () => {
      const beforeCreate = new Date();
      const event = createMovementEvent(
        MovementEventType.CREATED,
        mockMovementData,
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
      const event = createMovementEvent(
        MovementEventType.CREATED,
        mockMovementData,
      );

      expect(event.version).toBe('1.0');
    });

    it('should handle different movement data', () => {
      const differentMovementData: MovementData = {
        id: 'different-movement-id',
        accountId: 'different-account-id',
        amount: 250.75,
        type: MovementType.DEBIT,
        description: 'Different movement',
        status: MovementStatus.COMPLETED,
        createdAt: new Date('2023-06-15T10:30:00Z'),
      };

      const event = createMovementEvent(
        MovementEventType.CREATED,
        differentMovementData,
      );

      expect(event.data).toBe(differentMovementData);
      expect(event.data.id).toBe('different-movement-id');
      expect(event.data.amount).toBe(250.75);
      expect(event.data.type).toBe(MovementType.DEBIT);
    });

    it('should handle credit movements', () => {
      const creditMovement: MovementData = {
        ...mockMovementData,
        type: MovementType.CREDIT,
        amount: 500.0,
      };

      const event = createMovementEvent(
        MovementEventType.CREATED,
        creditMovement,
      );

      expect(event.data.type).toBe(MovementType.CREDIT);
      expect(event.data.amount).toBe(500.0);
    });

    it('should handle debit movements', () => {
      const debitMovement: MovementData = {
        ...mockMovementData,
        type: MovementType.DEBIT,
        amount: 200.25,
      };

      const event = createMovementEvent(
        MovementEventType.CREATED,
        debitMovement,
      );

      expect(event.data.type).toBe(MovementType.DEBIT);
      expect(event.data.amount).toBe(200.25);
    });

    it('should handle different movement statuses', () => {
      const statuses = [
        MovementStatus.PENDING,
        MovementStatus.COMPLETED,
        MovementStatus.CANCELLED,
      ];

      statuses.forEach((status) => {
        const movementWithStatus: MovementData = {
          ...mockMovementData,
          status,
        };

        const event = createMovementEvent(
          MovementEventType.CREATED,
          movementWithStatus,
        );

        expect(event.data.status).toBe(status);
      });
    });

    it('should handle zero amount movements', () => {
      const zeroAmountMovement: MovementData = {
        ...mockMovementData,
        amount: 0,
      };

      const event = createMovementEvent(
        MovementEventType.CREATED,
        zeroAmountMovement,
      );

      expect(event.data.amount).toBe(0);
    });

    it('should handle large amount movements', () => {
      const largeAmountMovement: MovementData = {
        ...mockMovementData,
        amount: 999999.99,
      };

      const event = createMovementEvent(
        MovementEventType.CREATED,
        largeAmountMovement,
      );

      expect(event.data.amount).toBe(999999.99);
    });

    it('should generate unique IDs for multiple events', () => {
      const uuid1 = 'uuid-1';
      const uuid2 = 'uuid-2';

      (crypto.randomUUID as any)
        .mockReturnValueOnce(uuid1)
        .mockReturnValueOnce(uuid2);

      const event1 = createMovementEvent(
        MovementEventType.CREATED,
        mockMovementData,
      );
      const event2 = createMovementEvent(
        MovementEventType.UPDATED,
        mockMovementData,
      );

      expect(event1.id).toBe(uuid1);
      expect(event2.id).toBe(uuid2);
      expect(event1.id).not.toBe(event2.id);
    });
  });

  describe('MovementEventType enum', () => {
    it('should have correct values', () => {
      expect(MovementEventType.ALL).toBe('movement.*');
      expect(MovementEventType.CREATED).toBe('movement.created');
      expect(MovementEventType.UPDATED).toBe('movement.updated');
      expect(MovementEventType.CANCELLED).toBe('movement.cancelled');
    });
  });

  describe('MovementEvent type', () => {
    it('should have correct structure', () => {
      const event: MovementEvent = {
        id: 'test-id',
        type: MovementEventType.CREATED,
        timestamp: new Date(),
        version: '1.0',
        correlationId: 'test-correlation',
        data: mockMovementData,
      };

      expect(event.id).toBe('test-id');
      expect(event.type).toBe(MovementEventType.CREATED);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.version).toBe('1.0');
      expect(event.correlationId).toBe('test-correlation');
      expect(event.data).toBe(mockMovementData);
    });
  });
});
