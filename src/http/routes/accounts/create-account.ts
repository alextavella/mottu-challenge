import { CreateAccountUseCase } from '@/domain/usecases/accounts/create-account-usecase';
import { getAccountRepository } from '@/infrastructure/container/container';
import { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const createAccountBodySchema = z.object({
  name: z
    .string({ message: 'Nome é obrigatório' })
    .min(1, 'Nome é obrigatório'),
  document: z
    .string({ message: 'Documento é obrigatório' })
    .min(11, 'Documento deve ter pelo menos 11 caracteres'),
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

      const accountRepository = getAccountRepository();
      const createAccountUseCase = new CreateAccountUseCase(accountRepository);

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
