import { createMovement } from '@/http/controllers/movements/create-movement';
import type { FastifyInstance } from 'fastify';

export async function movementRoutes(fastify: FastifyInstance) {
  await fastify.register(createMovement, { prefix: '/v1' });
}
