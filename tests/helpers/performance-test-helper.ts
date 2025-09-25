import { prisma } from '@/infra/database/client';
import { FastifyInstance } from 'fastify';

// Global instances for reuse across tests
let globalApp: FastifyInstance | null = null;
let isAppInitialized = false;

/**
 * Get or create a shared app instance for better performance
 * This reduces the overhead of creating new servers for each test
 */
export async function getSharedApp(): Promise<FastifyInstance> {
  if (!globalApp || !isAppInitialized) {
    const { createServerSimple } = await import('./server-test-helper');
    globalApp = await createServerSimple();
    isAppInitialized = true;
  }
  return globalApp;
}

/**
 * Clean up shared app instance
 */
export async function cleanupSharedApp(): Promise<void> {
  if (globalApp) {
    const { closeServerSimple } = await import('./server-test-helper');
    await closeServerSimple(globalApp);
    globalApp = null;
    isAppInitialized = false;
  }
}

/**
 * Optimized database cleanup using transactions
 * This is faster than individual deletes
 */
export async function fastCleanupTestDatabase(): Promise<void> {
  try {
    // Use transaction for atomic cleanup
    await prisma.$transaction(async (tx) => {
      await tx.ledgerLog.deleteMany();
      await tx.movement.deleteMany();
      await tx.account.deleteMany();
    });
  } catch (error) {
    console.warn(
      'Fast cleanup failed, falling back to individual deletes:',
      error,
    );
    // Fallback to individual deletes
    await prisma.ledgerLog.deleteMany();
    await prisma.movement.deleteMany();
    await prisma.account.deleteMany();
  }
}

/**
 * Create test account with optimized data
 */
export async function createTestAccount(overrides: any = {}) {
  const baseData = {
    name: 'Test Account',
    email: `test${Date.now()}@test.com`,
    document: `1234567890${Date.now().toString().slice(-4)}`,
    balance: 1000,
    ...overrides,
  };

  return await prisma.account.create({
    data: baseData,
  });
}

/**
 * Batch create multiple test accounts
 */
export async function createTestAccounts(count: number, overrides: any = {}) {
  const accounts = Array.from({ length: count }, (_, i) => ({
    name: `Test Account ${i + 1}`,
    email: `test${Date.now()}_${i}@test.com`,
    document: `1234567890${Date.now().toString().slice(-4)}${i}`,
    balance: 1000,
    ...overrides,
  }));

  return await prisma.account.createMany({
    data: accounts,
  });
}
