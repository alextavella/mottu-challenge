import { LedgerLogRepository } from '@/core/repositories/legder-log-repository';
import { CreateLedgerLogData } from '@/domain/contracts/repositories/ledger-log-repository';
import { MovementType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('LedgerLogRepository', () => {
  let repository: LedgerLogRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      ledgerLog: {
        create: vi.fn(),
      },
    };
    repository = new LedgerLogRepository(mockPrisma);
  });

  describe('create', () => {
    it('should create a new ledger log', async () => {
      const createData: CreateLedgerLogData = {
        movementId: 'movement-id',
        accountId: 'account-id',
        type: MovementType.CREDIT,
        amount: 100.5,
        data: {
          description: 'Test movement',
          metadata: { source: 'api' },
        },
      };

      const createdLedgerLog = {
        id: 'ledger-log-id',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: createData.amount,
        data: JSON.stringify(createData.data),
        createdAt: new Date(),
      };

      mockPrisma.ledgerLog.create.mockResolvedValue(createdLedgerLog);

      const result = await repository.create(createData);

      expect(mockPrisma.ledgerLog.create).toHaveBeenCalledWith({
        data: {
          movementId: createData.movementId,
          accountId: createData.accountId,
          type: createData.type,
          amount: createData.amount,
          data: JSON.stringify(createData.data),
        },
      });

      expect(result).toEqual(createdLedgerLog);
    });

    it('should handle debit movements', async () => {
      const createData: CreateLedgerLogData = {
        movementId: 'movement-id',
        accountId: 'account-id',
        type: MovementType.DEBIT,
        amount: 50.25,
        data: {
          description: 'Withdrawal',
          metadata: { atm: 'location-123' },
        },
      };

      const createdLedgerLog = {
        id: 'ledger-log-id',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: createData.amount,
        data: JSON.stringify(createData.data),
        createdAt: new Date(),
      };

      mockPrisma.ledgerLog.create.mockResolvedValue(createdLedgerLog);

      const result = await repository.create(createData);

      expect(result.type).toBe(MovementType.DEBIT);
      expect(result.amount).toBe(50.25);
    });

    it('should handle complex data objects', async () => {
      const complexData = {
        description: 'Complex movement',
        metadata: {
          source: 'mobile-app',
          version: '1.2.3',
          userAgent: 'MobileApp/1.0',
          location: {
            latitude: -23.5505,
            longitude: -46.6333,
            city: 'São Paulo',
          },
          tags: ['urgent', 'priority-high'],
        },
        timestamps: {
          initiated: new Date().toISOString(),
          processed: new Date().toISOString(),
        },
      };

      const createData: CreateLedgerLogData = {
        movementId: 'movement-id',
        accountId: 'account-id',
        type: MovementType.CREDIT,
        amount: 200.75,
        data: complexData,
      };

      const createdLedgerLog = {
        id: 'ledger-log-id',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: createData.amount,
        data: JSON.stringify(createData.data),
        createdAt: new Date(),
      };

      mockPrisma.ledgerLog.create.mockResolvedValue(createdLedgerLog);

      const result = await repository.create(createData);

      expect(result.data).toBe(JSON.stringify(complexData));
    });

    it('should handle empty data object', async () => {
      const createData: CreateLedgerLogData = {
        movementId: 'movement-id',
        accountId: 'account-id',
        type: MovementType.CREDIT,
        amount: 100,
        data: {},
      };

      const createdLedgerLog = {
        id: 'ledger-log-id',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: createData.amount,
        data: '{}',
        createdAt: new Date(),
      };

      mockPrisma.ledgerLog.create.mockResolvedValue(createdLedgerLog);

      const result = await repository.create(createData);

      expect(result.data).toBe('{}');
    });

    it('should handle null data', async () => {
      const createData: CreateLedgerLogData = {
        movementId: 'movement-id',
        accountId: 'account-id',
        type: MovementType.CREDIT,
        amount: 100,
        data: null as any,
      };

      const createdLedgerLog = {
        id: 'ledger-log-id',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: createData.amount,
        data: 'null',
        createdAt: new Date(),
      };

      mockPrisma.ledgerLog.create.mockResolvedValue(createdLedgerLog);

      const result = await repository.create(createData);

      expect(result.data).toBe('null');
    });

    it('should handle zero amount', async () => {
      const createData: CreateLedgerLogData = {
        movementId: 'movement-id',
        accountId: 'account-id',
        type: MovementType.CREDIT,
        amount: 0,
        data: { description: 'Zero amount movement' },
      };

      const createdLedgerLog = {
        id: 'ledger-log-id',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: 0,
        data: JSON.stringify(createData.data),
        createdAt: new Date(),
      };

      mockPrisma.ledgerLog.create.mockResolvedValue(createdLedgerLog);

      const result = await repository.create(createData);

      expect(result.amount).toBe(0);
    });

    it('should throw error if database operation fails', async () => {
      const createData: CreateLedgerLogData = {
        movementId: 'movement-id',
        accountId: 'account-id',
        type: MovementType.CREDIT,
        amount: 100,
        data: { description: 'Test' },
      };

      const error = new Error('Database error');
      mockPrisma.ledgerLog.create.mockRejectedValue(error);

      await expect(repository.create(createData)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
