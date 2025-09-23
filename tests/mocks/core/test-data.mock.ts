import { Prisma } from '@prisma/client';

/**
 * Factory para criar dados de teste de Account
 */
export const createMockAccountData = (overrides: Partial<any> = {}) => ({
  id: 'account-id-123',
  name: 'John Doe',
  document: '12345678901',
  email: 'john@example.com',
  balance: new Prisma.Decimal(1000),
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
  ...overrides,
});

/**
 * Factory para criar dados de teste de Movement
 */
export const createMockMovementData = (overrides: Partial<any> = {}) => ({
  id: 'movement-id-123',
  accountId: 'account-id-123',
  amount: new Prisma.Decimal(100),
  type: 'CREDIT' as const,
  description: 'Test movement',
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
  ...overrides,
});

/**
 * Factory para criar dados de entrada de Account
 */
export const createMockAccountInput = (overrides: Partial<any> = {}) => ({
  name: 'John Doe',
  document: '12345678901',
  email: 'john@example.com',
  ...overrides,
});

/**
 * Factory para criar dados de entrada de Movement
 */
export const createMockMovementInput = (overrides: Partial<any> = {}) => ({
  accountId: 'account-id-123',
  amount: 100,
  type: 'CREDIT' as const,
  description: 'Test movement',
  ...overrides,
});
