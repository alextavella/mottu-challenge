import { MovementRepository } from '@/core/repositories/movement-repository';
import { CreateMovementData } from '@/domain/entities/movement.entity';
import { MovementStatus, MovementType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('MovementRepository', () => {
  let repository: MovementRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      movement: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    } as any;

    repository = new MovementRepository(mockPrisma);
  });

  describe('create', () => {
    it('should create a new movement', async () => {
      const createData: CreateMovementData = {
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Test movement',
      };

      const createdMovement = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...createData,
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.movement.create).mockResolvedValue(createdMovement);

      const result = await repository.create(createData);

      expect(mockPrisma.movement.create).toHaveBeenCalledWith({
        data: {
          accountId: createData.accountId,
          amount: expect.any(Object), // Prisma.Decimal
          type: createData.type,
          description: createData.description,
        },
      });

      expect(result).toEqual(createdMovement);
    });

    it('should handle decimal amounts correctly', async () => {
      const createData: CreateMovementData = {
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 99.99,
        type: MovementType.DEBIT,
        description: 'Precise amount',
      };

      const createdMovement = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...createData,
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.movement.create).mockResolvedValue(createdMovement);

      await repository.create(createData);

      expect(mockPrisma.movement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: expect.any(Object),
        }),
      });
    });
  });

  describe('updateStatus', () => {
    it('should update movement status', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = MovementStatus.COMPLETED;

      const updatedMovement = {
        id: movementId,
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Test movement',
        status: newStatus,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.movement.update).mockResolvedValue(updatedMovement);

      const result = await repository.updateStatus(movementId, newStatus);

      expect(mockPrisma.movement.update).toHaveBeenCalledWith({
        where: { id: movementId },
        data: { status: newStatus },
      });

      expect(result).toEqual(updatedMovement);
    });

    it('should handle different status updates', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const statuses = [
        MovementStatus.PENDING,
        MovementStatus.COMPLETED,
        MovementStatus.CANCELLED,
      ];

      for (const status of statuses) {
        const updatedMovement = {
          id: movementId,
          accountId: '123e4567-e89b-12d3-a456-426614174001',
          amount: 100,
          type: MovementType.CREDIT,
          description: 'Test movement',
          status,
          createdAt: new Date(),
        };

        vi.mocked(mockPrisma.movement.update).mockResolvedValue(
          updatedMovement,
        );

        const result = await repository.updateStatus(movementId, status);

        expect(result.status).toBe(status);
      }
    });
  });

  describe('findById', () => {
    it('should find movement by id', async () => {
      const movementId = '123e4567-e89b-12d3-a456-426614174000';
      const movement = {
        id: movementId,
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Test movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.movement.findUnique).mockResolvedValue(movement);

      const result = await repository.findById(movementId);

      expect(mockPrisma.movement.findUnique).toHaveBeenCalledWith({
        where: { id: movementId },
      });

      expect(result).toEqual(movement);
    });

    it('should return null when movement not found', async () => {
      const movementId = 'non-existent-id';

      vi.mocked(mockPrisma.movement.findUnique).mockResolvedValue(null);

      const result = await repository.findById(movementId);

      expect(result).toBeNull();
    });
  });

  describe('findByAccountId', () => {
    it('should find movements by account id', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174001';
      const movements = [
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          accountId,
          amount: 100,
          type: MovementType.CREDIT,
          description: 'Credit',
          status: MovementStatus.COMPLETED,
          createdAt: new Date(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          accountId,
          amount: 50,
          type: MovementType.DEBIT,
          description: 'Debit',
          status: MovementStatus.PENDING,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.movement.findMany).mockResolvedValue(movements);

      const result = await repository.findByAccountId(accountId);

      expect(mockPrisma.movement.findMany).toHaveBeenCalledWith({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(movements);
    });

    it('should filter by movement type', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174001';
      const type = MovementType.CREDIT;

      vi.mocked(mockPrisma.movement.findMany).mockResolvedValue([]);

      await repository.findByAccountId(accountId, { type });

      expect(mockPrisma.movement.findMany).toHaveBeenCalledWith({
        where: { accountId, type },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by date range', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174001';
      const dateFrom = new Date('2023-01-01');
      const dateTo = new Date('2023-12-31');

      vi.mocked(mockPrisma.movement.findMany).mockResolvedValue([]);

      await repository.findByAccountId(accountId, { dateFrom, dateTo });

      expect(mockPrisma.movement.findMany).toHaveBeenCalledWith({
        where: {
          accountId,
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply pagination', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174001';
      const limit = 10;
      const offset = 20;

      vi.mocked(mockPrisma.movement.findMany).mockResolvedValue([]);

      await repository.findByAccountId(accountId, { limit, offset });

      expect(mockPrisma.movement.findMany).toHaveBeenCalledWith({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    });

    it('should apply custom ordering', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174001';
      const orderBy = 'amount';
      const orderDirection = 'asc';

      vi.mocked(mockPrisma.movement.findMany).mockResolvedValue([]);

      await repository.findByAccountId(accountId, { orderBy, orderDirection });

      expect(mockPrisma.movement.findMany).toHaveBeenCalledWith({
        where: { accountId },
        orderBy: { [orderBy]: orderDirection },
      });
    });

    it('should combine all filters', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174001';
      const type = MovementType.DEBIT;
      const dateFrom = new Date('2023-01-01');
      const dateTo = new Date('2023-12-31');
      const limit = 5;
      const offset = 10;
      const orderBy = 'amount';
      const orderDirection = 'desc';

      vi.mocked(mockPrisma.movement.findMany).mockResolvedValue([]);

      await repository.findByAccountId(accountId, {
        type,
        dateFrom,
        dateTo,
        limit,
        offset,
        orderBy,
        orderDirection,
      });

      expect(mockPrisma.movement.findMany).toHaveBeenCalledWith({
        where: {
          accountId,
          type,
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        orderBy: { [orderBy]: orderDirection },
        take: limit,
        skip: offset,
      });
    });
  });
});
