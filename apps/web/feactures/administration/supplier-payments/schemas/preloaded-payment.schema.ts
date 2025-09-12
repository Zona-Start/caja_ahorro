import { z } from 'zod';
import { PaymentMethodEnum } from '../../supplier-payments/schemas';

export const preloadedPaymentApiSchema = z.object({
  supplierId: z.number(),
  bankAccountId: z.number().nullable(),
  paymentDescription: z.string().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethodEnum).nullable(),
  bankReference: z.string().nullable(),
  transactionDate: z.string().nullable(), // viene como string
  amount: z.string(), // viene como string
});

export const preloadedPaymentResponseSchema = z.object({
  message: z.string(),
  data: preloadedPaymentApiSchema.nullable(),
});
