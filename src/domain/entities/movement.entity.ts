export { MovementStatus, MovementType } from '@prisma/client';
import z from 'zod';

export const movementSchema = z.object({
  id: z.uuid('ID deve ser um UUID válido'),
  accountId: z.uuid('AccountId deve ser um UUID válido'),
  amount: z.coerce
    .number({ message: 'Valor é obrigatório' })
    .positive('Valor deve ser positivo'),
  type: z.enum(['CREDIT', 'DEBIT'], {
    message: 'Tipo de movimento é obrigatório',
  }),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED'], {
    message: 'Status é obrigatório',
  }),
  createdAt: z.date('Data de criação é obrigatória'),
});

export type MovementData = z.infer<typeof movementSchema>;

export const createMovementSchema = z.object({
  accountId: z.uuid('AccountId deve ser um UUID válido'),
  amount: z.coerce
    .number({ message: 'Valor é obrigatório' })
    .positive('Valor deve ser positivo'),
  type: z.enum(['CREDIT', 'DEBIT'], {
    message: 'Tipo de movimento é obrigatório',
  }),
  description: z.string().optional(),
});

export type CreateMovementData = z.infer<typeof createMovementSchema>;
