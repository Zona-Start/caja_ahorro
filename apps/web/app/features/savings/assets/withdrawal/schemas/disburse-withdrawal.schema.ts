import { z } from 'zod';

export const disburseWithdrawalSchema = z.object({
  bankAccountId: z.number({
    required_error: 'La cuenta bancaria es requerida',
  }),
  processedAt: z.date({
    required_error: 'La fecha de procesamiento es requerida',
  }),
  bankReference: z.string().optional(),
});

export type DisburseWithdrawalValues = z.infer<typeof disburseWithdrawalSchema>;
