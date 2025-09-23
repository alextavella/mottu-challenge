import { CreateMovementUseCase } from '@/domain/usecases/movements/create-movement-usecase';
import { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const createMovementBodySchema = z.object({
  accountId: z.uuid('AccountId deve ser um UUID válido'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['CREDIT', 'DEBIT']),
  description: z.string().optional(),
});

const createMovementResponseSchema = z.object({
  movementId: z.uuid(),
});

const createMovementUseCase = new CreateMovementUseCase();

export async function createMovement(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/movements',
    schema: {
      description: 'Cria um movimento de crédito ou débito',
      tags: ['movements'],
      summary: 'Criar movimento financeiro',
      body: createMovementBodySchema,
      response: {
        201: createMovementResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { accountId, amount, type, description } = request.body;

      const movement = await createMovementUseCase.execute({
        accountId,
        amount,
        type,
        description,
      });

      reply.status(201).send({
        movementId: movement.movementId,
      });
    },
  });
}
