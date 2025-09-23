import { env } from '@/infrastructure/config/env.config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'test' ? [] : ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

export default prisma;
