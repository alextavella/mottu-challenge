import { MovementType } from '@prisma/client';

export type Movement = {
  readonly id: string;
  readonly accountId: string;
  readonly type: MovementType;
  readonly amount: number;
  readonly description?: string;
  readonly createdAt: Date;
};

export type CreateMovementData = {
  readonly accountId: string;
  readonly type: MovementType;
  readonly amount: number;
  readonly description?: string;
};

export { MovementType };
