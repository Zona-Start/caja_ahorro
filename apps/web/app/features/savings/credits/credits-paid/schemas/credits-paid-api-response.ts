import { z } from 'zod';

export const creditPaymentApiSchema = z.object({
  id: z.number(),
  creditId: z.number(),
  creditPaidId: z.string().nullable(),
  paymentDate: z.string(),
  paymentType: z.string(),
  amount: z.string(),
  bankId: z.number().nullable(),
  paymentMethod: z.string(),
  transactionReference: z.string().nullable(),
  comment: z.string().nullable(),
  creditCustomReference: z.string().nullable(),
  associateCedula: z.string().nullable(),
  associateFullname: z.string().nullable(),
  creditTypeName: z.string().nullable(),
  status: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

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
  message: z.string(),
  paymentId: z.number(),
});

export const creditPaymentDeleteResponseSchema = z.object({
  message: z.string(),
});

export type CreditPaymentApi = z.infer<typeof creditPaymentApiSchema>;
export type CreditPaymentApiResponse = z.infer<typeof creditPaymentApiResponseSchema>;
export type CreditPaymentMutationResponse = z.infer<typeof creditPaymentMutationSchema>;
export type CreditPaymentDeleteResponse = z.infer<typeof creditPaymentDeleteResponseSchema>;
