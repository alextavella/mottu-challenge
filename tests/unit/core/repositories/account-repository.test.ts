import { AccountRepository } from '@/core/repositories/account-repository';
import { Prisma, PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('AccountRepository', () => {
  let repository: AccountRepository;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = {
      account: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    } as any;

    repository = new AccountRepository(mockPrisma);
  });

  describe('getBalance', () => {
    it('should return balance when account exists', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174000';
      const mockAccount = {
        id: accountId,
        name: 'John Doe',
        document: '12345678901',
        email: 'john@example.com',
        balance: new Prisma.Decimal(1000.5),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockPrisma.account.findUnique).mockResolvedValue(mockAccount);

      const result = await repository.getBalance(accountId);

      expect(result).toBe(1000.5);
      expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
        select: { balance: true },
      });
    });

    it('should return null when account does not exist', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174000';

      vi.mocked(mockPrisma.account.findUnique).mockResolvedValue(null as any);

      const result = await repository.getBalance(accountId);

      expect(result).toBeNull();
      expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
        select: { balance: true },
      });
    });
  });
});
