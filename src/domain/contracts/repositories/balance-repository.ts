import { MovementData } from '@/domain/entities/movement.entity';

export interface IBalanceRepository {
  updateBalance(movement: MovementData, balance: number): Promise<MovementData>;
}
