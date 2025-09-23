import { prisma } from '@/infrastructure/database/client';

/**
 * Clean test database before each test
 * Uses TRUNCATE CASCADE for PostgreSQL for better performance
 */
export async function cleanupTestDatabase(): Promise<void> {
  try {
    // Clean database using TRUNCATE CASCADE for PostgreSQL
    await prisma.$executeRaw`TRUNCATE TABLE ledger_logs, movements, accounts RESTART IDENTITY CASCADE`;
  } catch (error) {
    // Fallback to individual deletes if TRUNCATE fails
    await prisma.ledgerLog.deleteMany();
    await prisma.movement.deleteMany();
    await prisma.account.deleteMany();
  }
}

/**
 * Disconnect from test database
 */
export async function disconnectTestDatabase(): Promise<void> {
  await prisma.$disconnect();
}
