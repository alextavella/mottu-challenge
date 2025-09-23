import { DomainError } from '@/core/errors/domain.error';
import { InsufficientFundsError } from '@/core/errors/movement.errors';

describe('Movement Errors', () => {
  describe('InsufficientFundsError', () => {
    it('should create error with correct message and properties', () => {
      const accountId = 'account-123';
      const requestedAmount = 100;
      const availableBalance = 50;

      const error = new InsufficientFundsError(
        accountId,
        requestedAmount,
        availableBalance,
      );

      expect(error.code).toBe('INSUFFICIENT_FUNDS');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe(
        `Insufficient funds for account ${accountId}. Requested: ${requestedAmount}, Available: ${availableBalance}`,
      );
      expect(error.name).toBe('InsufficientFundsError');
    });

    it('should be instance of DomainError', () => {
      const error = new InsufficientFundsError('account-1', 100, 50);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(InsufficientFundsError);
    });

    it('should handle decimal amounts correctly', () => {
      const accountId = 'account-456';
      const requestedAmount = 99.99;
      const availableBalance = 25.5;

      const error = new InsufficientFundsError(
        accountId,
        requestedAmount,
        availableBalance,
      );

      expect(error.message).toBe(
        `Insufficient funds for account ${accountId}. Requested: ${requestedAmount}, Available: ${availableBalance}`,
      );
      expect(error.code).toBe('INSUFFICIENT_FUNDS');
      expect(error.statusCode).toBe(400);
    });

    it('should handle zero balance correctly', () => {
      const accountId = 'account-789';
      const requestedAmount = 1;
      const availableBalance = 0;

      const error = new InsufficientFundsError(
        accountId,
        requestedAmount,
        availableBalance,
      );

      expect(error.message).toBe(
        `Insufficient funds for account ${accountId}. Requested: ${requestedAmount}, Available: ${availableBalance}`,
      );
    });

    it('should handle large amounts', () => {
      const accountId = 'account-large';
      const requestedAmount = 1000000.99;
      const availableBalance = 999999.99;

      const error = new InsufficientFundsError(
        accountId,
        requestedAmount,
        availableBalance,
      );

      expect(error.message).toContain('1000000.99');
      expect(error.message).toContain('999999.99');
    });

    it('should handle negative values', () => {
      const accountId = 'account-negative';
      const requestedAmount = 100;
      const availableBalance = -50;

      const error = new InsufficientFundsError(
        accountId,
        requestedAmount,
        availableBalance,
      );

      expect(error.message).toBe(
        `Insufficient funds for account ${accountId}. Requested: ${requestedAmount}, Available: ${availableBalance}`,
      );
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
        const error = new InsufficientFundsError(accountId, 100, 50);
        expect(error.message).toContain(accountId);
        expect(error.code).toBe('INSUFFICIENT_FUNDS');
      });
    });

    it('should be throwable and catchable', () => {
      const accountId = 'account-test';
      const requestedAmount = 200;
      const availableBalance = 100;

      expect(() => {
        throw new InsufficientFundsError(
          accountId,
          requestedAmount,
          availableBalance,
        );
      }).toThrow(
        `Insufficient funds for account ${accountId}. Requested: ${requestedAmount}, Available: ${availableBalance}`,
      );

      try {
        throw new InsufficientFundsError(
          accountId,
          requestedAmount,
          availableBalance,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientFundsError);
        expect((error as InsufficientFundsError).code).toBe(
          'INSUFFICIENT_FUNDS',
        );
        expect((error as InsufficientFundsError).statusCode).toBe(400);
      }
    });

    it('should have stack trace', () => {
      const error = new InsufficientFundsError('account-1', 100, 50);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('InsufficientFundsError');
    });

    it('should handle edge case with same requested and available amounts', () => {
      const accountId = 'account-edge';
      const amount = 100;

      const error = new InsufficientFundsError(accountId, amount, amount);

      expect(error.message).toBe(
        `Insufficient funds for account ${accountId}. Requested: ${amount}, Available: ${amount}`,
      );
    });

    it('should handle very small decimal amounts', () => {
      const accountId = 'account-small';
      const requestedAmount = 0.01;
      const availableBalance = 0.005;

      const error = new InsufficientFundsError(
        accountId,
        requestedAmount,
        availableBalance,
      );

      expect(error.message).toContain('0.01');
      expect(error.message).toContain('0.005');
    });
  });
});
