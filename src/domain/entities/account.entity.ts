import z from 'zod';

export const accountSchema = z.object({
  id: z.uuid('ID deve ser um UUID válido'),
  name: z.string('Nome é obrigatório'),
  document: z.string('Documento é obrigatório'),
  email: z.string('Email é obrigatório'),
  balance: z.coerce.number('Saldo é obrigatório'),
  createdAt: z.date('Data de criação é obrigatória'),
  updatedAt: z.date('Data de atualização é obrigatória'),
});

export type AccountData = z.infer<typeof accountSchema>;

export const createAccountSchema = z.object({
  name: z
    .string({ message: 'Nome é obrigatório' })
    .min(1, 'Nome é obrigatório'),
  document: z
    .string({ message: 'Documento é obrigatório' })
    .min(11, 'Documento deve ter pelo menos 11 caracteres'),
  email: z.email('Email deve ser válido'),
});

export type CreateAccountData = z.infer<typeof createAccountSchema>;
