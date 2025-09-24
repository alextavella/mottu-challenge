import {
  AccountNotFoundError,
  BusinessRuleViolationError,
} from '@/domain/errors/account.errors';
import { DomainError } from '@/domain/errors/domain.error';

describe('Account Errors', () => {
  describe('BusinessRuleViolationError', () => {
    it('should create error with default message', () => {
      const message = 'Business rule violated';
      const error = new BusinessRuleViolationError(message);

      expect(error.message).toBe(message);
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BusinessRuleViolationError');
    });

    it('should be instance of DomainError', () => {
      const error = new BusinessRuleViolationError('Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(BusinessRuleViolationError);
    });

    it('should have correct error properties', () => {
      const error = new BusinessRuleViolationError('Account already exists');

      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.statusCode).toBe(400);
    });

    it('should be throwable and catchable', () => {
      const message = 'Account creation failed';

      expect(() => {
        throw new BusinessRuleViolationError(message);
      }).toThrow(message);

      try {
        throw new BusinessRuleViolationError(message);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        expect((error as BusinessRuleViolationError).code).toBe(
          'BUSINESS_RULE_VIOLATION',
        );
      }
    });
  });

  describe('AccountNotFoundError', () => {
    it('should create error with account ID in message', () => {
      const accountId = 'account-123';
      const error = new AccountNotFoundError(accountId);

      expect(error.message).toBe(`Account with ID ${accountId} not found`);
      expect(error.code).toBe('ACCOUNT_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('AccountNotFoundError');
    });

    it('should be instance of DomainError', () => {
      const error = new AccountNotFoundError('test-id');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(AccountNotFoundError);
    });

    it('should handle different account ID formats', () => {
      const testCases = [
        'account-123',
        'acc_456',
        '789',
        'user-account-xyz',
        '550e8400-e29b-41d4-a716-446655440000', // UUID format
      ];

      testCases.forEach((accountId) => {
        const error = new AccountNotFoundError(accountId);
        expect(error.message).toBe(`Account with ID ${accountId} not found`);
        expect(error.code).toBe('ACCOUNT_NOT_FOUND');
        expect(error.statusCode).toBe(404);
      });
    });

    it('should handle empty or special characters in account ID', () => {
      const specialCases = [
        '',
        ' ',
        'account with spaces',
        'account@email.com',
      ];

      specialCases.forEach((accountId) => {
        const error = new AccountNotFoundError(accountId);
        expect(error.message).toBe(`Account with ID ${accountId} not found`);
      });
    });

    it('should be throwable and catchable', () => {
      const accountId = 'missing-account-456';

      expect(() => {
        throw new AccountNotFoundError(accountId);
      }).toThrow(`Account with ID ${accountId} not found`);

      try {
        throw new AccountNotFoundError(accountId);
      } catch (error) {
        expect(error).toBeInstanceOf(AccountNotFoundError);
        expect((error as AccountNotFoundError).code).toBe('ACCOUNT_NOT_FOUND');
        expect((error as AccountNotFoundError).statusCode).toBe(404);
      }
    });

    it('should have stack trace', () => {
      const error = new AccountNotFoundError('test-account');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AccountNotFoundError');
    });
  });
});
