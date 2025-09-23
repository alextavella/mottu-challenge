import { Movement, MovementType, Prisma } from '@prisma/client';

export interface IMovementRepository {
  create(data: CreateMovementData): Promise<Movement>;
  findById(id: string): Promise<Movement | null>;
  findByAccountId(
    accountId: string,
    options?: FindMovementOptions,
  ): Promise<Movement[]>;
}

export type CreateMovementData = {
  accountId: string;
  amount: Prisma.Decimal | number;
  type: MovementType;
  description?: string | null;
};

export type FindMovementOptions = {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'amount';
  orderDirection?: 'asc' | 'desc';
  type?: MovementType;
  dateFrom?: Date;
  dateTo?: Date;
};
