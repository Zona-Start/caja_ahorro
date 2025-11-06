import { z } from 'zod';

// Esquema de validación para el registro de pagos
export const creditPaymentApiSchema = z.object({
  id: z.number().optional(),
  customReference: z.string(),
  paymentDate: z.string(),
  paymentType: z.string(),
  paymentMethod: z.string(),
  bankName: z.string().nullable(),
  transactionReference: z.string().nullable(),
  amount: z.string(),
  balancePending: z.string(),
  associateCedula: z.string(),
  associatesFullname: z.string(),
});

// Tipo inferido
export type CreditPaymentApi = z.infer<typeof creditPaymentApiSchema>;

// Esquema de respuesta para API (puedes ajustarlo según tu backend)
export const creditPaymentApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(creditPaymentApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});

export const creditPaymentMutationSchema = z.object({
  message: z.string().optional(),
});
