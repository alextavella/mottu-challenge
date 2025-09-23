import { createAccount } from '@/adapters/controllers/accounts/create-account';
import { getAccountBalance } from '@/adapters/controllers/accounts/get-account-balance';
import type { FastifyInstance } from 'fastify';

export async function accountRoutes(fastify: FastifyInstance) {
  await fastify.register(createAccount, { prefix: '/v1' });
  await fastify.register(getAccountBalance, { prefix: '/v1' });
}
