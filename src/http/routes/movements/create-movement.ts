import prisma from '@/database/client';
import { BadRequestError } from '@/http/errors/bad-request-error';
import { NotFoundError } from '@/http/errors/not-found-error';
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
  accountId: z.uuid(),
  amount: z.number().refine((amount) => amount > 0, 'Valor deve ser positivo'),
  type: z.enum(['CREDIT', 'DEBIT']),
  description: z.string().optional(),
  createdAt: z.date(),
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

      const account = await prisma.account
        .findUnique({
          where: {
            id: accountId,
          },
        })
        .catch(() => null);

      if (!account) {
        throw new NotFoundError('Account not found');
      }

      if (type === 'DEBIT' && account.balance.toNumber() < amount) {
        throw new BadRequestError('Insufficient balance');
      }

      const movement = await prisma.movement
        .create({
          data: {
            accountId,
            amount,
            type,
            description,
          },
        })
        .catch(() => null);

      if (!movement) {
        throw new BadRequestError('Failed to create movement');
      }

      const updateBalance = await prisma.account.update({
        where: {
          id: accountId,
        },
        data: {
          balance:
            type === 'CREDIT'
              ? account.balance.add(amount)
              : account.balance.sub(amount),
        },
      });

      if (!updateBalance) {
        throw new BadRequestError('Failed to update balance');
      }

      const ledgerLog = await prisma.ledgerLog
        .create({
          data: {
            movementId: movement.id,
            accountId,
            amount,
            type,
          },
        })
        .catch(() => null);

      if (!ledgerLog) {
        throw new BadRequestError('Failed to create ledger log');
      }

      reply.status(201).send({
        movementId: movement.id,
        accountId,
        amount,
        type,
        description,
        createdAt: movement.createdAt,
      });
    },
  });
}
