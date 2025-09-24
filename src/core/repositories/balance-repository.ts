import { IBalanceRepository } from '@/domain/contracts/repositories/balance-repository';
import {
  MovementData,
  MovementStatus,
  movementSchema,
} from '@/domain/entities/movement.entity';
import { PrismaClient } from '@prisma/client';

export class BalanceRepository implements IBalanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async updateBalance(
    movement: MovementData,
    balance: number,
  ): Promise<MovementData> {
    const [, updatedMovement] = await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: movement.accountId },
        data: { balance: balance },
      }),
      this.prisma.movement.update({
        where: { id: movement.id },
        data: { status: MovementStatus.COMPLETED },
      }),
    ]);

    return movementSchema.parse(updatedMovement);
  }
}
