import { DomainError } from '../domain.error';

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
