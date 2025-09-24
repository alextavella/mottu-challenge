import {
  AccountData,
  CreateAccountData,
} from '@/domain/entities/account.entity';
import {
  CreateMovementData,
  MovementData,
} from '@/domain/entities/movement.entity';
import { MovementStatus, MovementType } from '@prisma/client';

/**
 * Factory para criar dados de teste de Account
 */
export const createMockAccountData = (
  overrides: Partial<AccountData> = {},
): AccountData => ({
  id: 'account-id-123',
  name: 'John Doe',
  document: '12345678901',
  email: 'john@example.com',
  balance: 1000,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
  ...overrides,
});

/**
 * Factory para criar dados de teste de Movement
 */
export const createMockMovementData = (
  overrides: Partial<MovementData> = {},
): MovementData => ({
  id: 'movement-id-123',
  accountId: 'account-id-123',
  amount: 100,
  type: MovementType.CREDIT,
  description: 'Test movement',
  status: MovementStatus.PENDING,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  ...overrides,
});

/**
 * Factory para criar dados de entrada de Account
 */
export const createMockAccountInput = (
  overrides: Partial<CreateAccountData> = {},
): CreateAccountData => ({
  name: 'John Doe',
  document: '12345678901',
  email: 'john@example.com',
  ...overrides,
});

/**
 * Factory para criar dados de entrada de Movement
 */
export const createMockMovementInput = (
  overrides: Partial<CreateMovementData> = {},
): CreateMovementData => ({
  accountId: 'account-id-123',
  amount: 100,
  type: MovementType.CREDIT,
  description: 'Test movement',
  ...overrides,
});
