import {
  FindMovementOptions,
  IMovementRepository,
} from '@/core/contracts/repositories/movement-repository';
import { CreateMovementData } from '@/core/entities/movement.entity';
import { Movement, Prisma, PrismaClient } from '@prisma/client';

export class MovementRepository implements IMovementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateMovementData): Promise<Movement> {
    return await this.prisma.movement.create({
      data: {
        accountId: data.accountId,
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        description: data.description,
      },
    });
  }

  async findById(id: string): Promise<Movement | null> {
    return await this.prisma.movement.findUnique({
      where: { id },
    });
  }

  async findByAccountId(
    accountId: string,
    options?: FindMovementOptions,
  ): Promise<Movement[]> {
    const where: Prisma.MovementWhereInput = {
      accountId,
      ...(options?.type && { type: options.type }),
      ...(options?.dateFrom &&
        options?.dateTo && {
          createdAt: {
            gte: options.dateFrom,
            lte: options.dateTo,
          },
        }),
    };

    const orderBy = this.buildOrderBy(options);

    return await this.prisma.movement.findMany({
      where,
      orderBy,
      take: options?.limit,
      skip: options?.offset,
    });
  }

  private buildOrderBy(
    options?: FindMovementOptions,
  ): Prisma.MovementOrderByWithRelationInput {
    const orderField = options?.orderBy || 'createdAt';
    const orderDirection = options?.orderDirection || 'desc';

    return {
      [orderField]: orderDirection,
    };
  }
}
