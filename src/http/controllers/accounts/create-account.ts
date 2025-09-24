import { CreateAccountUseCase } from '@/core/usecases/accounts/create-account-usecase';
import { createAccountSchema } from '@/domain/entities/account.entity';
import { getAccountRepository } from '@/infra/container/dependency-injection.container';
import { getEventManager } from '@/infra/events/event-manager';
import { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const createAccountBodySchema = createAccountSchema;
const createAccountResponseSchema = z.object({
  accountId: z.uuid(),
});

export async function createAccount(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/accounts',
    schema: {
      description: 'Cria uma nova conta com limite inicial de 1000 BRL',
      tags: ['accounts'],
      summary: 'Criar nova conta',
      body: createAccountBodySchema,
      response: {
        201: createAccountResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { name, document, email } = request.body;

      const accountRepository = getAccountRepository();
      const eventManager = getEventManager();
      const createAccountUseCase = new CreateAccountUseCase(
        accountRepository,
        eventManager,
      );

      const account = await createAccountUseCase.execute({
        name,
        document,
        email,
      });

      reply.status(201).send({
        accountId: account.accountId,
      });
    },
  });
}
