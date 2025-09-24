import { CreateMovementUseCase } from '@/core/usecases/movements/create-movement-usecase';
import { createMovementSchema } from '@/domain/entities/movement.entity';
import {
  getAccountRepository,
  getMovementRepository,
} from '@/infra/container/dependency-injection.container';
import { getEventManager } from '@/infra/events/event-manager';
import { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const createMovementBodySchema = createMovementSchema;
const createMovementResponseSchema = z.object({
  movementId: z.uuid(),
});

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

      const eventManager = getEventManager(fastify.log);
      const accountRepository = getAccountRepository();
      const movementRepository = getMovementRepository();

      const createMovementUseCase = new CreateMovementUseCase(
        accountRepository,
        movementRepository,
        eventManager,
      );

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
