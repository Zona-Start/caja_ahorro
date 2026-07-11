import { z } from 'zod';

export const InitialReconciliationSchema = z.object({
  createAdjustment: z.boolean(),
  bankAccountId: z.string().uuid(),
  lastStatementBalance: z.number(),
  lastStatementDate: z.coerce.date(),
  reconciliationDate: z.coerce.date(),
});

export type InitialReconciliationDto = z.infer<
  typeof InitialReconciliationSchema
>;
