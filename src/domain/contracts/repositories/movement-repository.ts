import {
  CreateMovementData,
  MovementData,
  MovementStatus,
  MovementType,
} from '@/domain/entities/movement.entity';

export interface IMovementRepository {
  create(data: CreateMovementData): Promise<MovementData>;
  updateStatus(id: string, status: MovementStatus): Promise<MovementData>;
  findById(id: string): Promise<MovementData | null>;
  findByAccountId(
    accountId: string,
    options?: FindMovementOptions,
  ): Promise<MovementData[]>;
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
