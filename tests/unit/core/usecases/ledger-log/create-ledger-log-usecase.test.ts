import { CreateLedgerLogUseCase } from '@/core/usecases/ledger-log/create-ledger-log-usecase';
import { CreateLedgerLogData } from '@/domain/entities/ledger-log.entity';
import { ServerError } from '@/domain/errors/server.error';
import { MovementType } from '@prisma/client';
import { createLedgerLogRepositoryMock } from 'tests/mocks/core/repositories/ledger-log-repository.mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CreateLedgerLogUseCase', () => {
  let useCase: CreateLedgerLogUseCase;
  let mockLedgerLogRepository: ReturnType<typeof createLedgerLogRepositoryMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLedgerLogRepository = createLedgerLogRepositoryMock();
    useCase = new CreateLedgerLogUseCase(mockLedgerLogRepository);
  });

  describe('execute', () => {
    it('should create a ledger log successfully', async () => {
      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440000',
        accountId: '550e8400-e29b-41d4-a716-446655440001',
        type: MovementType.CREDIT,
        amount: 100.5,
        data: {
          description: 'Test movement',
          metadata: { source: 'api' },
        },
      };

      const createdLedgerLog = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        movementId: input.movementId,
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        data: input.data,
        processedAt: new Date(),
      };

      vi.mocked(mockLedgerLogRepository.create).mockResolvedValue(
        createdLedgerLog,
      );

      await expect(useCase.execute(input)).resolves.toBeUndefined();

      expect(mockLedgerLogRepository.create).toHaveBeenCalledWith({
        movementId: input.movementId,
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        data: input.data,
      });
    });

    it('should handle debit movements', async () => {
      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440003',
        accountId: '550e8400-e29b-41d4-a716-446655440004',
        type: MovementType.DEBIT,
        amount: 50.25,
        data: {
          description: 'Withdrawal',
          metadata: { atm: 'location-123' },
        },
      };

      const createdLedgerLog = {
        id: '550e8400-e29b-41d4-a716-446655440005',
        movementId: input.movementId,
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        data: input.data,
        processedAt: new Date(),
      };

      vi.mocked(mockLedgerLogRepository.create).mockResolvedValue(
        createdLedgerLog,
      );

      await expect(useCase.execute(input)).resolves.toBeUndefined();

      expect(mockLedgerLogRepository.create).toHaveBeenCalledWith({
        movementId: input.movementId,
        accountId: input.accountId,
        type: MovementType.DEBIT,
        amount: input.amount,
        data: input.data,
      });
    });

    it('should handle zero amount movements', async () => {
      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440006',
        accountId: '550e8400-e29b-41d4-a716-446655440007',
        type: MovementType.CREDIT,
        amount: 0,
        data: {
          description: 'Zero amount movement',
        },
      };

      const createdLedgerLog = {
        id: '550e8400-e29b-41d4-a716-446655440008',
        movementId: input.movementId,
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        data: input.data,
        processedAt: new Date(),
      };

      vi.mocked(mockLedgerLogRepository.create).mockResolvedValue(
        createdLedgerLog,
      );

      await expect(useCase.execute(input)).resolves.toBeUndefined();

      expect(mockLedgerLogRepository.create).toHaveBeenCalledWith({
        movementId: input.movementId,
        accountId: input.accountId,
        type: MovementType.CREDIT,
        amount: 0,
        data: input.data,
      });
    });

    it('should handle empty data object', async () => {
      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440009',
        accountId: '550e8400-e29b-41d4-a716-446655440010',
        type: MovementType.CREDIT,
        amount: 100,
        data: {},
      };

      const createdLedgerLog = {
        id: '550e8400-e29b-41d4-a716-446655440011',
        movementId: input.movementId,
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        data: input.data,
        processedAt: new Date(),
      };

      vi.mocked(mockLedgerLogRepository.create).mockResolvedValue(
        createdLedgerLog,
      );

      await expect(useCase.execute(input)).resolves.toBeUndefined();

      expect(mockLedgerLogRepository.create).toHaveBeenCalledWith({
        movementId: input.movementId,
        accountId: input.accountId,
        type: MovementType.CREDIT,
        amount: 100,
        data: {},
      });
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

      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440012',
        accountId: '550e8400-e29b-41d4-a716-446655440013',
        type: MovementType.CREDIT,
        amount: 200.75,
        data: complexData,
      };

      const createdLedgerLog = {
        id: '550e8400-e29b-41d4-a716-446655440014',
        movementId: input.movementId,
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        data: input.data,
        processedAt: new Date(),
      };

      vi.mocked(mockLedgerLogRepository.create).mockResolvedValue(
        createdLedgerLog,
      );

      await expect(useCase.execute(input)).resolves.toBeUndefined();

      expect(mockLedgerLogRepository.create).toHaveBeenCalledWith({
        movementId: input.movementId,
        accountId: input.accountId,
        type: MovementType.CREDIT,
        amount: 200.75,
        data: complexData,
      });
    });

    it('should throw ServerError when repository fails', async () => {
      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440015',
        accountId: '550e8400-e29b-41d4-a716-446655440016',
        type: MovementType.CREDIT,
        amount: 100,
        data: { description: 'Test' },
      };

      const repositoryError = new Error('Database connection failed');
      vi.mocked(mockLedgerLogRepository.create).mockRejectedValue(
        repositoryError,
      );

      await expect(useCase.execute(input)).rejects.toThrow(ServerError);
    });

    it('should handle different error types from repository', async () => {
      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440019',
        accountId: '550e8400-e29b-41d4-a716-446655440020',
        type: MovementType.CREDIT,
        amount: 100,
        data: { description: 'Test' },
      };

      const validationError = new Error('Validation failed: invalid UUID');
      vi.mocked(mockLedgerLogRepository.create).mockRejectedValue(
        validationError,
      );

      await expect(useCase.execute(input)).rejects.toThrow(ServerError);
    });

    it('should handle network timeout errors', async () => {
      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440021',
        accountId: '550e8400-e29b-41d4-a716-446655440022',
        type: MovementType.CREDIT,
        amount: 100,
        data: { description: 'Test' },
      };

      const timeoutError = new Error('Request timeout');
      vi.mocked(mockLedgerLogRepository.create).mockRejectedValue(timeoutError);

      await expect(useCase.execute(input)).rejects.toThrow(ServerError);
    });

    it('should handle large amounts correctly', async () => {
      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440023',
        accountId: '550e8400-e29b-41d4-a716-446655440024',
        type: MovementType.CREDIT,
        amount: 999999.99,
        data: {
          description: 'Large amount transaction',
          currency: 'BRL',
        },
      };

      const createdLedgerLog = {
        id: '550e8400-e29b-41d4-a716-446655440025',
        movementId: input.movementId,
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        data: input.data,
        processedAt: new Date(),
      };

      vi.mocked(mockLedgerLogRepository.create).mockResolvedValue(
        createdLedgerLog,
      );

      await expect(useCase.execute(input)).resolves.toBeUndefined();

      expect(mockLedgerLogRepository.create).toHaveBeenCalledWith({
        movementId: input.movementId,
        accountId: input.accountId,
        type: MovementType.CREDIT,
        amount: 999999.99,
        data: input.data,
      });
    });

    it('should handle negative amounts for debit movements', async () => {
      const input: CreateLedgerLogData = {
        movementId: '550e8400-e29b-41d4-a716-446655440026',
        accountId: '550e8400-e29b-41d4-a716-446655440027',
        type: MovementType.DEBIT,
        amount: -50.25,
        data: {
          description: 'Negative amount debit',
          note: 'This represents a withdrawal',
        },
      };

      const createdLedgerLog = {
        id: '550e8400-e29b-41d4-a716-446655440028',
        movementId: input.movementId,
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        data: input.data,
        processedAt: new Date(),
      };

      vi.mocked(mockLedgerLogRepository.create).mockResolvedValue(
        createdLedgerLog,
      );

      await expect(useCase.execute(input)).resolves.toBeUndefined();

      expect(mockLedgerLogRepository.create).toHaveBeenCalledWith({
        movementId: input.movementId,
        accountId: input.accountId,
        type: MovementType.DEBIT,
        amount: -50.25,
        data: input.data,
      });
    });
  });
});
