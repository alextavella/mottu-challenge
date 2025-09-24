import { DomainError } from './domain.error';

export class InsufficientFundsError extends DomainError {
  readonly code = 'INSUFFICIENT_FUNDS';
  readonly statusCode = 400;

  constructor(
    accountId: string,
    requestedAmount: number,
    availableBalance: number,
  ) {
    super(
      `Insufficient funds for account ${accountId}. Requested: ${requestedAmount}, Available: ${availableBalance}`,
    );
  }
}

export class InvalidMovementAmountError extends DomainError {
  readonly code = 'INVALID_MOVEMENT_AMOUNT';
  readonly statusCode = 400;

  constructor(amount: number) {
    super(`Invalid movement amount: ${amount}`);
  }
}

export class MovementNotFoundError extends DomainError {
  readonly code = 'MOVEMENT_NOT_FOUND';
  readonly statusCode = 404;

  constructor(movementId: string) {
    super(`Movement with ID ${movementId} not found`);
  }
}
