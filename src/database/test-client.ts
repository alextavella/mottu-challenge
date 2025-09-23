import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'test') {
  // For tests, create a new client instance
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./test.db',
      },
    },
  });
} else {
  // Use the regular client for non-test environments
  prisma = new PrismaClient();
}

export { prisma };
