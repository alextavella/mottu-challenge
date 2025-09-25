import { UpdateAccountBalance } from '@/domain/entities/account-balance.entity';
import { AccountData } from '@/domain/entities/account.entity';
import {
  CreateMovementData,
  MovementType,
} from '@/domain/entities/movement.entity';
import {
  InsufficientFundsError,
  InvalidMovementAmountError,
} from '@/domain/errors/movement.errors';

describe('UpdateAccountBalance Entity', () => {
  const mockAccount: AccountData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    document: '12345678901',
    email: 'john.doe@example.com',
    balance: 1000.0,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  };

  describe('Constructor', () => {
    it('should create instance with valid account and movement data', () => {
      const movement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 100.5,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(mockAccount, movement);

      expect(updateBalance).toBeInstanceOf(UpdateAccountBalance);
    });

    it('should accept credit movement', () => {
      const creditMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 200.75,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        creditMovement,
      );

      expect(updateBalance).toBeInstanceOf(UpdateAccountBalance);
    });

    it('should accept debit movement', () => {
      const debitMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 150.25,
        type: MovementType.DEBIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        debitMovement,
      );

      expect(updateBalance).toBeInstanceOf(UpdateAccountBalance);
    });
  });

  describe('validate()', () => {
    it('should pass validation for valid credit movement', () => {
      const creditMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 100.5,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        creditMovement,
      );

      expect(() => updateBalance.validate()).not.toThrow();
    });

    it('should pass validation for valid debit movement with sufficient balance', () => {
      const debitMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 500.0,
        type: MovementType.DEBIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        debitMovement,
      );

      expect(() => updateBalance.validate()).not.toThrow();
    });

    it('should pass validation for debit movement with exact balance', () => {
      const debitMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 1000.0,
        type: MovementType.DEBIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        debitMovement,
      );

      expect(() => updateBalance.validate()).not.toThrow();
    });

    it('should throw InvalidMovementAmountError for zero amount', () => {
      const zeroAmountMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 0,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        zeroAmountMovement,
      );

      expect(() => updateBalance.validate()).toThrow(
        InvalidMovementAmountError,
      );
    });

    it('should throw InvalidMovementAmountError for negative amount', () => {
      const negativeAmountMovement: Pick<
        CreateMovementData,
        'amount' | 'type'
      > = {
        amount: -100.5,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        negativeAmountMovement,
      );

      expect(() => updateBalance.validate()).toThrow(
        InvalidMovementAmountError,
      );
    });

    it('should throw InsufficientFundsError for debit with insufficient balance', () => {
      const insufficientFundsMovement: Pick<
        CreateMovementData,
        'amount' | 'type'
      > = {
        amount: 1500.0,
        type: MovementType.DEBIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        insufficientFundsMovement,
      );

      expect(() => updateBalance.validate()).toThrow(InsufficientFundsError);
    });

    it('should throw InsufficientFundsError for debit exceeding balance', () => {
      const exceedingBalanceMovement: Pick<
        CreateMovementData,
        'amount' | 'type'
      > = {
        amount: 1000.01,
        type: MovementType.DEBIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        exceedingBalanceMovement,
      );

      expect(() => updateBalance.validate()).toThrow(InsufficientFundsError);
    });

    it('should include correct error details for InsufficientFundsError', () => {
      const insufficientFundsMovement: Pick<
        CreateMovementData,
        'amount' | 'type'
      > = {
        amount: 1500.0,
        type: MovementType.DEBIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        insufficientFundsMovement,
      );

      expect(() => updateBalance.validate()).toThrow(
        new InsufficientFundsError(
          mockAccount.id,
          insufficientFundsMovement.amount,
          mockAccount.balance,
        ),
      );
    });

    it('should include correct error details for InvalidMovementAmountError', () => {
      const invalidAmountMovement: Pick<CreateMovementData, 'amount' | 'type'> =
        {
          amount: 0,
          type: MovementType.CREDIT,
        };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        invalidAmountMovement,
      );

      expect(() => updateBalance.validate()).toThrow(
        new InvalidMovementAmountError(invalidAmountMovement.amount),
      );
    });
  });

  describe('perform()', () => {
    it('should increase balance for credit movement', async () => {
      const creditMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 200.5,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        creditMovement,
      );
      const result = await updateBalance.perform();

      expect(result.balance).toBe(1200.5);
      expect(result.id).toBe(mockAccount.id);
      expect(result.name).toBe(mockAccount.name);
      expect(result.document).toBe(mockAccount.document);
      expect(result.email).toBe(mockAccount.email);
    });

    it('should decrease balance for debit movement', async () => {
      const debitMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 300.75,
        type: MovementType.DEBIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        debitMovement,
      );
      const result = await updateBalance.perform();

      expect(result.balance).toBe(699.25);
      expect(result.id).toBe(mockAccount.id);
      expect(result.name).toBe(mockAccount.name);
      expect(result.document).toBe(mockAccount.document);
      expect(result.email).toBe(mockAccount.email);
    });

    it('should handle decimal amounts correctly for credit', async () => {
      const creditMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 0.01,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        creditMovement,
      );
      const result = await updateBalance.perform();

      expect(result.balance).toBe(1000.01);
    });

    it('should handle decimal amounts correctly for debit', async () => {
      const debitMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 0.01,
        type: MovementType.DEBIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        debitMovement,
      );
      const result = await updateBalance.perform();

      expect(result.balance).toBe(999.99);
    });

    it('should handle large amounts correctly', async () => {
      const largeCreditMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 999999.99,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        largeCreditMovement,
      );
      const result = await updateBalance.perform();

      expect(result.balance).toBe(1000999.99);
    });

    it('should return new account data object', async () => {
      const creditMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 100.0,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        creditMovement,
      );
      const result = await updateBalance.perform();

      expect(result).not.toBe(mockAccount); // Should be a new object
      expect(result).toEqual({
        ...mockAccount,
        balance: 1100.0,
      });
    });

    it('should preserve all account properties except balance', async () => {
      const creditMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 50.25,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        creditMovement,
      );
      const result = await updateBalance.perform();

      expect(result.id).toBe(mockAccount.id);
      expect(result.name).toBe(mockAccount.name);
      expect(result.document).toBe(mockAccount.document);
      expect(result.email).toBe(mockAccount.email);
      expect(result.createdAt).toBe(mockAccount.createdAt);
      expect(result.updatedAt).toBe(mockAccount.updatedAt);
      expect(result.balance).toBe(1050.25);
    });
  });

  describe('Integration tests', () => {
    it('should validate and perform credit movement successfully', async () => {
      const creditMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 250.75,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        creditMovement,
      );

      // Should not throw during validation
      expect(() => updateBalance.validate()).not.toThrow();

      // Should return updated account
      const result = await updateBalance.perform();
      expect(result.balance).toBe(1250.75);
    });

    it('should validate and perform debit movement successfully', async () => {
      const debitMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 750.25,
        type: MovementType.DEBIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        debitMovement,
      );

      // Should not throw during validation
      expect(() => updateBalance.validate()).not.toThrow();

      // Should return updated account
      const result = await updateBalance.perform();
      expect(result.balance).toBe(249.75);
    });

    it('should throw error during validation and not perform operation', async () => {
      const invalidMovement: Pick<CreateMovementData, 'amount' | 'type'> = {
        amount: 0,
        type: MovementType.CREDIT,
      };

      const updateBalance = new UpdateAccountBalance(
        mockAccount,
        invalidMovement,
      );

      // Should throw during validation
      expect(() => updateBalance.validate()).toThrow(
        InvalidMovementAmountError,
      );

      // Should still be able to perform (validation is separate from execution)
      // This tests the separation of concerns
      const result = await updateBalance.perform();
      expect(result.balance).toBe(1000.0); // Original balance unchanged
    });
  });
});
