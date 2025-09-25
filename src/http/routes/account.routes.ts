import { createAccount } from '@/http/controllers/accounts/create-account';
import { getAccountBalance } from '@/http/controllers/accounts/get-account-balance';
import type { FastifyInstance } from 'fastify';

export async function accountRoutes(fastify: FastifyInstance) {
  await fastify.register(createAccount);
  await fastify.register(getAccountBalance);
}
