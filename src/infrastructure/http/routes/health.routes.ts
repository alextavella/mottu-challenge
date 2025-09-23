import { healthCheck } from '@/adapters/controllers/health/health-check';
import type { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  await fastify.register(healthCheck);
}
