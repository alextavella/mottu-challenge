import { IEntity, IValidatableEntity } from '../contracts/entities/interfaces';
import {
  InsufficientFundsError,
  InvalidMovementAmountError,
} from '../errors/movement.errors';
import { AccountData } from './account.entity';
import { CreateMovementData, MovementType } from './movement.entity';

type IUpdateAccountBalance = IEntity<AccountData> & IValidatableEntity;

export class UpdateAccountBalance implements IUpdateAccountBalance {
  private data: AccountData | null = null;

  constructor(
    private readonly account: AccountData,
    private readonly movement: Pick<CreateMovementData, 'amount' | 'type'>,
  ) {}

  validate(): void {
    // Check if the movement amount is valid
    if (this.movement.amount <= 0) {
      throw new InvalidMovementAmountError(this.movement.amount);
    }

    // Check if there's sufficient balance for debit operations
    if (
      this.movement.type === MovementType.DEBIT &&
      this.account.balance < this.movement.amount
    ) {
      throw new InsufficientFundsError(
        this.account.id,
        this.movement.amount,
        this.account.balance,
      );
    }
  }

  async perform(): Promise<AccountData> {
    // Calculate the new balance
    const newBalance =
      this.movement.type === MovementType.CREDIT
        ? this.account.balance + this.movement.amount
        : this.account.balance - this.movement.amount;

    // Update the account balance
    this.data = { ...this.account, balance: newBalance };

    return this.data;
  }
}
