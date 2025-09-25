import { UseCaseContainer } from '@/core/usecases/container/usecase.container';
import { getEventManager } from '@/infra/events/event-manager';
import { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const getAccountBalanceParamsSchema = z.object({
  id: z.uuid('ID deve ser um UUID válido'),
});
const getAccountBalanceResponseSchema = z.object({
  accountId: z.uuid(),
  name: z.string(),
  balance: z.number(),
});

export async function getAccountBalance(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/accounts/:id/balance',
    schema: {
      description: 'Consulta o saldo da conta',
      tags: ['accounts'],
      summary: 'Consultar saldo da conta',
      params: getAccountBalanceParamsSchema,
      response: {
        200: getAccountBalanceResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id: accountId } = request.params;

      const eventManager = getEventManager(fastify.log);
      const container = UseCaseContainer.getInstance(eventManager);
      const getAccountBalanceUseCase = container.getGetAccountBalanceUseCase();

      const accountBalance = await getAccountBalanceUseCase.execute({
        accountId,
      });

      reply.status(200).send({
        accountId: accountBalance.accountId,
        name: accountBalance.name,
        balance: accountBalance.balance,
      });
    },
  });
}
