import { CreateMovementData } from '@/core/entities/movement.entity';
import { Movement, MovementType } from '@prisma/client';

export interface IMovementRepository {
  create(data: CreateMovementData): Promise<Movement>;
  findById(id: string): Promise<Movement | null>;
  findByAccountId(
    accountId: string,
    options?: FindMovementOptions,
  ): Promise<Movement[]>;
}

export type FindMovementOptions = {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'amount';
  orderDirection?: 'asc' | 'desc';
  type?: MovementType;
  dateFrom?: Date;
  dateTo?: Date;
};
