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
