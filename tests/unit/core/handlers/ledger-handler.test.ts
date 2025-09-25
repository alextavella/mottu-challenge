import { MovementEvent, MovementEventType } from '@/core/events/movement-event';
import { LedgerLogHandler } from '@/core/handlers/ledger-handler';
import type { ILedgerLogRepository } from '@/domain/contracts/repositories/ledger-log-repository';
import { MovementStatus, MovementType } from '@prisma/client';
import { createLedgerLogRepositoryMock } from 'tests/mocks/core/repositories/ledger-log-repository.mock';
import { vi } from 'vitest';

describe('LedgerLogHandler', () => {
  let handler: LedgerLogHandler;
  let mockRepository: ILedgerLogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createLedgerLogRepositoryMock();
    handler = new LedgerLogHandler(mockRepository);
  });

  describe('handle', () => {
    it('should create ledger log for movement event', async () => {
      const movementEvent: MovementEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: MovementEventType.CREATED,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        version: '1.0',
        correlationId: '550e8400-e29b-41d4-a716-446655440001',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          accountId: '550e8400-e29b-41d4-a716-446655440003',
          amount: 100.5,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          description: 'Test movement',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      vi.mocked(mockRepository.create).mockResolvedValueOnce({} as any);

      await handler.handle(movementEvent);

      expect(mockRepository.create).toHaveBeenCalledWith({
        movementId: '550e8400-e29b-41d4-a716-446655440002',
        accountId: '550e8400-e29b-41d4-a716-446655440003',
        type: MovementType.CREDIT,
        amount: 100.5,
        data: movementEvent.data || {},
      });
    });

    it('should handle debit movement events', async () => {
      const movementEvent: MovementEvent = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        type: MovementEventType.CREATED,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        version: '1.0',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440005',
          accountId: '550e8400-e29b-41d4-a716-446655440006',
          amount: 50.25,
          type: MovementType.DEBIT,
          status: MovementStatus.PENDING,
          description: 'Debit test',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      vi.mocked(mockRepository.create).mockResolvedValueOnce({} as any);

      await handler.handle(movementEvent);

      expect(mockRepository.create).toHaveBeenCalledWith({
        movementId: '550e8400-e29b-41d4-a716-446655440005',
        accountId: '550e8400-e29b-41d4-a716-446655440006',
        type: MovementType.DEBIT,
        amount: 50.25,
        data: movementEvent.data || {},
      });
    });

    it('should throw error when database operation fails', async () => {
      const movementEvent: MovementEvent = {
        id: '550e8400-e29b-41d4-a716-446655440007',
        type: MovementEventType.CREATED,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        version: '1.0',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440008',
          accountId: '550e8400-e29b-41d4-a716-446655440009',
          amount: 75.0,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          description: 'Failed movement',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      const dbError = new Error('Database connection failed');
      vi.mocked(mockRepository.create).mockRejectedValueOnce(dbError);

      await expect(handler.handle(movementEvent)).rejects.toThrow(
        `Failed to create ledger log for movement 550e8400-e29b-41d4-a716-446655440008`,
      );
    });

    it('should serialize event data correctly', async () => {
      const movementEvent: MovementEvent = {
        id: '550e8400-e29b-41d4-a716-446655440010',
        type: MovementEventType.CREATED,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        version: '1.0',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440011',
          accountId: '550e8400-e29b-41d4-a716-446655440012',
          amount: 123.45,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          description: 'Serialization test',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      vi.mocked(mockRepository.create).mockResolvedValueOnce({} as any);

      await handler.handle(movementEvent);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: movementEvent.data }),
      );
    });

    it('should handle zero amount movements', async () => {
      const movementEvent: MovementEvent = {
        id: '550e8400-e29b-41d4-a716-446655440013',
        type: MovementEventType.CREATED,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        version: '1.0',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440014',
          accountId: '550e8400-e29b-41d4-a716-446655440015',
          amount: 0,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          description: 'Zero amount test',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      vi.mocked(mockRepository.create).mockResolvedValueOnce({} as any);

      await handler.handle(movementEvent);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 0 }),
      );
    });

    it('should handle events without correlation ID', async () => {
      const movementEvent: MovementEvent = {
        id: '550e8400-e29b-41d4-a716-446655440016',
        type: MovementEventType.CREATED,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        version: '1.0',
        // No correlationId
        data: {
          id: '550e8400-e29b-41d4-a716-446655440017',
          accountId: '550e8400-e29b-41d4-a716-446655440018',
          amount: 99.99,
          type: MovementType.DEBIT,
          status: MovementStatus.PENDING,
          description: 'No correlation ID test',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      vi.mocked(mockRepository.create).mockResolvedValueOnce({} as any);

      await expect(handler.handle(movementEvent)).resolves.not.toThrow();
    });

    it('should throw ServerError for invalid event data', async () => {
      const invalidEvent: MovementEvent = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: MovementEventType.CREATED,
        timestamp: new Date('2024-01-01T00:00:00Z'),
        version: '1.0',
        correlationId: '550e8400-e29b-41d4-a716-446655440001',
        data: {
          id: 'invalid-uuid', // Invalid UUID
          accountId: '550e8400-e29b-41d4-a716-446655440003',
          amount: 100.5,
          type: MovementType.CREDIT,
          status: MovementStatus.PENDING,
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      await expect(handler.handle(invalidEvent)).rejects.toThrow(
        'Failed to validate ledger log',
      );
    });
  });
});
