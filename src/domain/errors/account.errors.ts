import { DomainError } from './domain.error';

export class BusinessRuleViolationError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly statusCode = 400;
}

export class AccountNotFoundError extends DomainError {
  readonly code = 'ACCOUNT_NOT_FOUND';
  readonly statusCode = 404;

  constructor(accountId: string) {
    super(`Account with ID ${accountId} not found`);
  }
}
