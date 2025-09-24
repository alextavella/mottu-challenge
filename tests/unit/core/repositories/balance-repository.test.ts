import { BalanceRepository } from '@/core/repositories/balance-repository';
import { MovementData } from '@/domain/entities/movement.entity';
import { MovementStatus, MovementType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('BalanceRepository', () => {
  let repository: BalanceRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(),
      account: {
        update: vi.fn(),
      },
      movement: {
        update: vi.fn(),
      },
    };
    repository = new BalanceRepository(mockPrisma);
  });

  describe('updateBalance', () => {
    it('should update account balance and movement status', async () => {
      const movementData: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100.5,
        type: MovementType.CREDIT,
        description: 'Test movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const newBalance = 1100.5;
      const updatedMovement = {
        ...movementData,
        status: MovementStatus.COMPLETED,
      };

      mockPrisma.$transaction.mockResolvedValue([
        { id: 'account-id', balance: newBalance },
        updatedMovement,
      ]);

      const result = await repository.updateBalance(movementData, newBalance);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        mockPrisma.account.update({
          where: { id: movementData.accountId },
          data: { balance: newBalance },
        }),
        mockPrisma.movement.update({
          where: { id: movementData.id },
          data: { status: MovementStatus.COMPLETED },
        }),
      ]);

      expect(result).toEqual(updatedMovement);
    });

    it('should handle debit movements', async () => {
      const movementData: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 50.25,
        type: MovementType.DEBIT,
        description: 'Test debit',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const newBalance = 949.75;
      const updatedMovement = {
        ...movementData,
        status: MovementStatus.COMPLETED,
      };

      mockPrisma.$transaction.mockResolvedValue([
        { id: 'account-id', balance: newBalance },
        updatedMovement,
      ]);

      const result = await repository.updateBalance(movementData, newBalance);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        mockPrisma.account.update({
          where: { id: movementData.accountId },
          data: { balance: newBalance },
        }),
        mockPrisma.movement.update({
          where: { id: movementData.id },
          data: { status: MovementStatus.COMPLETED },
        }),
      ]);

      expect(result).toEqual(updatedMovement);
    });

    it('should handle zero balance', async () => {
      const movementData: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000,
        type: MovementType.DEBIT,
        description: 'Withdraw all',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const newBalance = 0;
      const updatedMovement = {
        ...movementData,
        status: MovementStatus.COMPLETED,
      };

      mockPrisma.$transaction.mockResolvedValue([
        { id: 'account-id', balance: newBalance },
        updatedMovement,
      ]);

      const result = await repository.updateBalance(movementData, newBalance);

      expect(result).toEqual(updatedMovement);
    });

    it('should handle negative balance', async () => {
      const movementData: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100,
        type: MovementType.DEBIT,
        description: 'Overdraft',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const newBalance = -50;
      const updatedMovement = {
        ...movementData,
        status: MovementStatus.COMPLETED,
      };

      mockPrisma.$transaction.mockResolvedValue([
        { id: 'account-id', balance: newBalance },
        updatedMovement,
      ]);

      const result = await repository.updateBalance(movementData, newBalance);

      expect(result).toEqual(updatedMovement);
    });

    it('should throw error if transaction fails', async () => {
      const movementData: MovementData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 100,
        type: MovementType.CREDIT,
        description: 'Test movement',
        status: MovementStatus.PENDING,
        createdAt: new Date(),
      };

      const error = new Error('Database error');
      mockPrisma.$transaction.mockRejectedValue(error);

      await expect(
        repository.updateBalance(movementData, 1100),
      ).rejects.toThrow('Database error');
    });
  });
});
