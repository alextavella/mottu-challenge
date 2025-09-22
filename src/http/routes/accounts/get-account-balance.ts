import prisma from '@/database/client';
import { NotFoundError } from '@/http/errors/not-found-error';
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
      description: 'Consulta o saldo atual e limite de crédito disponível',
      tags: ['accounts'],
      summary: 'Consultar saldo da conta',
      params: getAccountBalanceParamsSchema,
      response: {
        200: getAccountBalanceResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { id: accountId } = request.params;

      const account = await prisma.account.findUnique({
        where: {
          id: accountId,
        },
      });

      if (!account) {
        throw new NotFoundError('Account not found');
      }

      reply.send({
        accountId,
        name: account.name,
        balance: account.balance.toNumber(),
      });
    },
  });
}
