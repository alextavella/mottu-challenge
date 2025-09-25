import { LedgerLogRepository } from '@/core/repositories/legder-log-repository';
import { CreateLedgerLogData } from '@/domain/contracts/repositories/ledger-log-repository';
import { MovementType, Prisma, PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('LedgerLogRepository', () => {
  let repository: LedgerLogRepository;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = {
      ledgerLog: {
        create: vi.fn(),
      },
    } as any;

    repository = new LedgerLogRepository(mockPrisma);
  });

  describe('create', () => {
    it('should create a new ledger log', async () => {
      const createData: CreateLedgerLogData = {
        movementId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        type: MovementType.CREDIT,
        amount: 100.5,
        data: {
          description: 'Test movement',
          metadata: { source: 'api' },
        },
      };

      const createdLedgerLog = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: new Prisma.Decimal(createData.amount),
        data: JSON.stringify(createData.data),
        processedAt: new Date(),
      };

      vi.mocked(mockPrisma.ledgerLog.create).mockResolvedValue(
        createdLedgerLog,
      );

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

      expect(result).toEqual({
        ...createdLedgerLog,
        amount: createData.amount,
        data: createData.data,
      });
    });

    it('should handle debit movements', async () => {
      const createData: CreateLedgerLogData = {
        movementId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        type: MovementType.DEBIT,
        amount: 50.25,
        data: {
          description: 'Withdrawal',
          metadata: { atm: 'location-123' },
        },
      };

      const createdLedgerLog = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: new Prisma.Decimal(createData.amount),
        data: JSON.stringify(createData.data),
        processedAt: new Date(),
      };

      vi.mocked(mockPrisma.ledgerLog.create).mockResolvedValue(
        createdLedgerLog,
      );

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
        movementId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        type: MovementType.CREDIT,
        amount: 200.75,
        data: complexData,
      };

      const createdLedgerLog = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: new Prisma.Decimal(createData.amount),
        data: JSON.stringify(createData.data),
        processedAt: new Date(),
      };

      vi.mocked(mockPrisma.ledgerLog.create).mockResolvedValue(
        createdLedgerLog,
      );

      const result = await repository.create(createData);

      expect(result.data).toEqual(complexData);
    });

    it('should handle empty data object', async () => {
      const createData: CreateLedgerLogData = {
        movementId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        type: MovementType.CREDIT,
        amount: 100,
        data: {},
      };

      const createdLedgerLog = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: new Prisma.Decimal(createData.amount),
        data: '{}',
        processedAt: new Date(),
      };

      vi.mocked(mockPrisma.ledgerLog.create).mockResolvedValue(
        createdLedgerLog,
      );

      const result = await repository.create(createData);

      expect(result.data).toEqual({});
    });

    it('should handle null data', async () => {
      const createData: CreateLedgerLogData = {
        movementId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        type: MovementType.CREDIT,
        amount: 100,
        data: null as any,
      };

      const createdLedgerLog = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: new Prisma.Decimal(createData.amount),
        data: 'null',
        processedAt: new Date(),
      };

      vi.mocked(mockPrisma.ledgerLog.create).mockResolvedValue(
        createdLedgerLog,
      );

      const result = await repository.create(createData);

      expect(result.data).toBeNull();
    });

    it('should handle zero amount', async () => {
      const createData: CreateLedgerLogData = {
        movementId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        type: MovementType.CREDIT,
        amount: 0,
        data: { description: 'Zero amount movement' },
      };

      const createdLedgerLog = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        movementId: createData.movementId,
        accountId: createData.accountId,
        type: createData.type,
        amount: new Prisma.Decimal(0),
        data: JSON.stringify(createData.data),
        processedAt: new Date(),
      };

      vi.mocked(mockPrisma.ledgerLog.create).mockResolvedValue(
        createdLedgerLog,
      );

      const result = await repository.create(createData);

      expect(result.amount).toBe(0);
    });

    it('should throw error if database operation fails', async () => {
      const createData: CreateLedgerLogData = {
        movementId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        type: MovementType.CREDIT,
        amount: 100,
        data: { description: 'Test' },
      };

      const error = new Error('Database error');
      vi.mocked(mockPrisma.ledgerLog.create).mockRejectedValue(error);

      await expect(repository.create(createData)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
