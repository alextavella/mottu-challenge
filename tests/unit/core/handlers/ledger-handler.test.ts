import { MovementEvent, MovementEventType } from '@/core/events/movement-event';
import { LedgerLogHandler } from '@/core/handlers/ledger-handler';
import { prisma } from '@/infra/database/client';
import { MovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the database client
vi.mock('@/infra/database/client', () => ({
  prisma: {
    ledgerLog: {
      create: vi.fn(),
    },
  },
}));

describe('LedgerLogHandler', () => {
  let handler: LedgerLogHandler;
  let mockLedgerLogCreate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLedgerLogCreate = vi.mocked(prisma.ledgerLog.create);
    handler = new LedgerLogHandler();
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
          amount: new Decimal(100.5),
          type: MovementType.CREDIT,
          description: 'Test movement',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      mockLedgerLogCreate.mockResolvedValueOnce({} as any);

      await handler.handle(movementEvent);

      expect(mockLedgerLogCreate).toHaveBeenCalledWith({
        data: {
          movementId: 'movement-123',
          accountId: 'account-456',
          type: MovementEventType.CREATED,
          amount: new Decimal(100.5),
          data: JSON.stringify(movementEvent.data),
        },
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
          amount: new Decimal(50.25),
          type: MovementType.DEBIT,
          description: 'Debit test',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      mockLedgerLogCreate.mockResolvedValueOnce({} as any);

      await handler.handle(movementEvent);

      expect(mockLedgerLogCreate).toHaveBeenCalledWith({
        data: {
          movementId: 'movement-456',
          accountId: 'account-789',
          type: MovementEventType.CREATED,
          amount: new Decimal(50.25),
          data: JSON.stringify(movementEvent.data),
        },
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
          amount: new Decimal(75.0),
          type: MovementType.CREDIT,
          description: 'Failed movement',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      const dbError = new Error('Database connection failed');
      mockLedgerLogCreate.mockRejectedValueOnce(dbError);

      await expect(handler.handle(movementEvent)).rejects.toThrow(
        'Failed to create ledger log for movement movement-789',
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
          amount: new Decimal(123.45),
          type: MovementType.CREDIT,
          description: 'Serialization test',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      mockLedgerLogCreate.mockResolvedValueOnce({} as any);

      await handler.handle(movementEvent);

      const expectedDataString = JSON.stringify(movementEvent.data);
      expect(mockLedgerLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          data: expectedDataString,
        }),
      });
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
          amount: new Decimal(0),
          type: MovementType.CREDIT,
          description: 'Zero amount test',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      mockLedgerLogCreate.mockResolvedValueOnce({} as any);

      await handler.handle(movementEvent);

      expect(mockLedgerLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: new Decimal(0),
        }),
      });
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
          amount: new Decimal(99.99),
          type: MovementType.DEBIT,
          description: 'No correlation ID test',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      };

      mockLedgerLogCreate.mockResolvedValueOnce({} as any);

      await expect(handler.handle(movementEvent)).resolves.not.toThrow();
    });
  });
});
