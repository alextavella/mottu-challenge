import { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const healthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string().datetime(),
});

export async function healthCheck(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/health',
    schema: {
      description: 'Verifica o status da aplicação',
      tags: ['health'],
      summary: 'Health check',
      response: {
        200: healthResponseSchema,
      },
    },
    handler: async (request, reply) => {
      reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    },
  });
}
