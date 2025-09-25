import {
  CreateMovementData,
  MovementData,
  MovementStatus,
  MovementType,
} from '@/domain/entities/movement.entity';

describe('Movement Entity', () => {
  describe('MovementData type', () => {
    it('should define correct structure for movement data', () => {
      const movementData: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Test movement',
        status: MovementStatus.PENDING,
        createdAt: new Date('2023-01-01T00:00:00Z'),
      };

      expect(movementData.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(movementData.accountId).toBe(
        '123e4567-e89b-12d3-a456-426614174001',
      );
      expect(movementData.amount).toBe(100.5);
      expect(movementData.type).toBe(MovementType.CREDIT);
      expect(movementData.description).toBe('Test movement');
      expect(movementData.status).toBe(MovementStatus.PENDING);
      expect(movementData.createdAt).toBeInstanceOf(Date);
    });

    it('should accept different movement types', () => {
      const creditMovement: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Credit movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const debitMovement: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 50.25,
        type: MovementType.DEBIT,
        description: 'Debit movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      expect(creditMovement.type).toBe(MovementType.CREDIT);
      expect(debitMovement.type).toBe(MovementType.DEBIT);
    });

    it('should accept different movement statuses', () => {
      const pendingMovement: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Pending movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const completedMovement: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Completed movement',
        status: MovementStatus.COMPLETED,
        createdAt: new Date(),
      };

      const cancelledMovement: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Cancelled movement',
        status: MovementStatus.CANCELLED,
        createdAt: new Date(),
      };

      expect(pendingMovement.status).toBe(MovementStatus.PENDING);
      expect(completedMovement.status).toBe(MovementStatus.COMPLETED);
      expect(cancelledMovement.status).toBe(MovementStatus.CANCELLED);
    });

    it('should handle optional description field', () => {
      const movementWithDescription: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Test description',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const movementWithoutDescription: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      expect(movementWithDescription.description).toBe('Test description');
      expect(movementWithoutDescription.description).toBeUndefined();
    });

    it('should handle different amount values', () => {
      const testCases = [
        { amount: 0.01, description: 'Minimum amount' },
        { amount: 100.5, description: 'Decimal amount' },
        { amount: 1000, description: 'Integer amount' },
        { amount: 999999.99, description: 'Large amount' },
      ];

      testCases.forEach(({ amount, description }) => {
        const movement: MovementData = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          accountId: '123e4567-e89b-12d3-a456-426614174001',
          amount,
          type: MovementType.CREDIT,
          description,
          status: MovementStatus.PENDING,
          createdAt: new Date(),
        };

        expect(movement.amount).toBe(amount);
      });
    });

    it('should handle different date formats', () => {
      const now = new Date();
      const pastDate = new Date('2023-01-01T00:00:00Z');
      const futureDate = new Date('2030-12-31T23:59:59Z');

      const movements: MovementData[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          accountId: '123e4567-e89b-12d3-a456-426614174001',
          amount: 100.5,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          createdAt: now,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          accountId: '123e4567-e89b-12d3-a456-426614174001',
          amount: 100.5,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          createdAt: pastDate,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          accountId: '123e4567-e89b-12d3-a456-426614174001',
          amount: 100.5,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          createdAt: futureDate,
        },
      ];

      movements.forEach((movement) => {
        expect(movement.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('CreateMovementData type', () => {
    it('should define correct structure for movement creation', () => {
      const createMovementData: CreateMovementData = {
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Test movement creation',
      };

      expect(createMovementData.accountId).toBe(
        '123e4567-e89b-12d3-a456-426614174001',
      );
      expect(createMovementData.amount).toBe(100.5);
      expect(createMovementData.type).toBe(MovementType.CREDIT);
      expect(createMovementData.description).toBe('Test movement creation');
    });

    it('should accept different movement types for creation', () => {
      const creditMovement: CreateMovementData = {
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Credit movement',
      };

      const debitMovement: CreateMovementData = {
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 50.25,
        type: MovementType.DEBIT,
        description: 'Debit movement',
      };

      expect(creditMovement.type).toBe(MovementType.CREDIT);
      expect(debitMovement.type).toBe(MovementType.DEBIT);
    });

    it('should handle optional description field for creation', () => {
      const movementWithDescription: CreateMovementData = {
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Test description',
      };

      const movementWithoutDescription: CreateMovementData = {
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
      };

      expect(movementWithDescription.description).toBe('Test description');
      expect(movementWithoutDescription.description).toBeUndefined();
    });

    it('should handle different amount values for creation', () => {
      const testCases = [
        { amount: 0.01, description: 'Minimum amount' },
        { amount: 100.5, description: 'Decimal amount' },
        { amount: 1000, description: 'Integer amount' },
        { amount: 999999.99, description: 'Large amount' },
      ];

      testCases.forEach(({ amount, description }) => {
        const movement: CreateMovementData = {
          accountId: '123e4567-e89b-12d3-a456-426614174001',
          amount,
          type: MovementType.CREDIT,
          description,
        };

        expect(movement.amount).toBe(amount);
      });
    });

    it('should handle different account IDs for creation', () => {
      const accountIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '987fcdeb-51a2-43d1-9f12-345678901234',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ];

      accountIds.forEach((accountId) => {
        const movement: CreateMovementData = {
          accountId,
          amount: 100.5,
          type: MovementType.CREDIT,
          description: 'Test movement',
        };

        expect(movement.accountId).toBe(accountId);
      });
    });
  });

  describe('MovementType enum', () => {
    it('should have correct values', () => {
      expect(MovementType.CREDIT).toBe('CREDIT');
      expect(MovementType.DEBIT).toBe('DEBIT');
    });

    it('should be usable in type checking', () => {
      const creditType: MovementType = MovementType.CREDIT;
      const debitType: MovementType = MovementType.DEBIT;

      expect(creditType).toBe('CREDIT');
      expect(debitType).toBe('DEBIT');
    });
  });

  describe('MovementStatus enum', () => {
    it('should have correct values', () => {
      expect(MovementStatus.PENDING).toBe('PENDING');
      expect(MovementStatus.COMPLETED).toBe('COMPLETED');
      expect(MovementStatus.CANCELLED).toBe('CANCELLED');
    });

    it('should be usable in type checking', () => {
      const pendingStatus: MovementStatus = MovementStatus.PENDING;
      const completedStatus: MovementStatus = MovementStatus.COMPLETED;
      const cancelledStatus: MovementStatus = MovementStatus.CANCELLED;

      expect(pendingStatus).toBe('PENDING');
      expect(completedStatus).toBe('COMPLETED');
      expect(cancelledStatus).toBe('CANCELLED');
    });
  });
});
