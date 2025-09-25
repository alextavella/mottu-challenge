import {
  FindMovementOptions,
  IMovementRepository,
} from '@/domain/contracts/repositories/movement-repository';
import {
  CreateMovementData,
  MovementData,
  MovementStatus,
  movementSchema,
} from '@/domain/entities/movement.entity';
import { Prisma, PrismaClient } from '@prisma/client';

export class MovementRepository implements IMovementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateMovementData): Promise<MovementData> {
    return await this.prisma.movement
      .create({
        data: {
          accountId: data.accountId,
          amount: new Prisma.Decimal(data.amount),
          type: data.type,
          description: data.description,
        },
      })
      .then((movement) => movementSchema.parse(movement));
  }

  async updateStatus(
    id: string,
    status: MovementStatus,
  ): Promise<MovementData> {
    return await this.prisma.movement
      .update({
        where: { id },
        data: {
          status,
        },
      })
      .then((movement) => movementSchema.parse(movement));
  }

  async findById(id: string): Promise<MovementData | null> {
    const movement = await this.prisma.movement.findUnique({
      where: { id },
    });

    return movement ? movementSchema.parse(movement) : null;
  }

  async findByAccountId(
    accountId: string,
    options?: FindMovementOptions,
  ): Promise<MovementData[]> {
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

    return await this.prisma.movement
      .findMany({
        where,
        orderBy,
        take: options?.limit,
        skip: options?.offset,
      })
      .then((movements) =>
        movements.map((movement) => movementSchema.parse(movement)),
      );
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
