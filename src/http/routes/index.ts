import { FastifyInstance } from 'fastify';
import { createAccount } from './accounts/create-account';
import { getAccountBalance } from './accounts/get-account-balance';
import { healthCheck } from './health/health-check';
import { createMovement } from './movements/create-movement';

export async function routes(fastify: FastifyInstance) {
  await fastify.register(healthCheck);
  await fastify.register(createAccount, { prefix: '/v1' });
  await fastify.register(getAccountBalance, { prefix: '/v1' });
  await fastify.register(createMovement, { prefix: '/v1' });
}
