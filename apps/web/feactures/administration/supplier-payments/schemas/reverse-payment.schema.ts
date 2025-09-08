
import { z } from 'zod';

export const reversePaymentAccountSchema = z.object({
  id: z.number(),
  selected: z.boolean(),
  paymentNumber: z.string(),
  supplierName: z.string().optional(),
  totalAmount: z.number(),
  status: z.string(),
  requestedAt: z.string(),
});

export const reversePaymentSchema = z.object({
  payments: z.array(reversePaymentAccountSchema),
});

export type ReversePayment = z.infer<typeof reversePaymentSchema>;
