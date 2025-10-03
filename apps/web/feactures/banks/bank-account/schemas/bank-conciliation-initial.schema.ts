import z from 'zod';

export const initialReconciliationSchema = z.object({
  bankAccountId: z.number(),
  reconciliationDate: z.date(),
  lastStatementBalance: z.number(),
  lastStatementDate: z.date(),
  createAdjustment: z.boolean(),
});

export type InitialReconciliation = z.infer<typeof initialReconciliationSchema>;
