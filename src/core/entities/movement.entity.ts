export type MovementType = 'credit' | 'debit';

export interface Movement {
  readonly id: string;
  readonly accountId: string;
  readonly type: MovementType;
  readonly amount: number;
  readonly description?: string;
  readonly createdAt: Date;
}

export interface CreateMovementData {
  readonly accountId: string;
  readonly type: MovementType;
  readonly amount: number;
  readonly description?: string;
}
