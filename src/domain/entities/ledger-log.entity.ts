import z from 'zod';

export const ledgerLogSchema = z.object({
  id: z.uuid(),
  movementId: z.uuid(),
  accountId: z.uuid(),
  amount: z.coerce.number(),
  type: z.enum(['CREDIT', 'DEBIT']),
  data: z
    .union([z.record(z.string(), z.any()), z.string()])
    .transform((data) => {
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return {};
        }
      }
      return data;
    })
    .optional(),
  processedAt: z.date().optional(),
});

export type LedgerLogData = z.infer<typeof ledgerLogSchema>;

export const createLedgerLogSchema = z.object({
  movementId: z.uuid({ message: 'MovementId deve ser um UUID válido' }),
  accountId: z.uuid({ message: 'AccountId deve ser um UUID válido' }),
  type: z.enum(['CREDIT', 'DEBIT'], {
    message: 'Tipo de movimento é obrigatório',
  }),
  amount: z.number({ message: 'Amount é obrigatório' }),
  data: z.record(z.string(), z.any()),
});

export type CreateLedgerLogData = z.infer<typeof createLedgerLogSchema>;
