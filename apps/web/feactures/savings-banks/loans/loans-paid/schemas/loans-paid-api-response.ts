import { z } from 'zod';

// Esquema de validación para el registro de pagos
export const loanPaymentApiSchema = z.object({
  id: z.number().optional(),
  customReference: z.string(),
  paymentDate: z.string(),
  paymentType: z.string(),
  paymentMethod: z.string(),
  bankName: z.string(),
  transactionReference: z.string(),
  amount: z.string(),
  balancePending: z.string(),
  associateCedula: z.string(),
  associateFullname: z.string(),
});

// Tipo inferido
export type LoanPaymentApi = z.infer<typeof loanPaymentApiSchema>;

// Esquema de respuesta para API (puedes ajustarlo según tu backend)
export const loanPaymentApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(loanPaymentApiSchema),
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

export const loanPaymentMutationSchema = z.object({
  message: z.string().optional(),
});
