import prisma from '@/database/client';
import { BadRequestError } from '@/http/errors/bad-request-error';
import { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const createAccountBodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  document: z.string().min(11, 'Documento deve ter pelo menos 11 caracteres'),
  email: z.email('Email deve ser válido'),
});

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

      const account = await prisma.account
        .create({
          data: {
            name,
            document,
            email,
          },
        })
        .catch(() => null);

      if (!account) {
        throw new BadRequestError('Failed to create account');
      }

      reply.status(201).send({
        accountId: account.id,
      });
    },
  });
}
