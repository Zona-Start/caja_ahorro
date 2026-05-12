import { z } from 'zod';

export const loanPaymentApiSchema = z.object({
  id: z.number(),
  loanId: z.number(),
  associateId: z.number(),
  amount: z.string(),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  reference: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  creditId: z.number().optional(),
  paymentType: z.string().optional(),
  bankId: z.number().optional(),
  bankName: z.string().nullable().optional(),
  transactionReference: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  associateCedula: z.string().nullable().optional(),
  associateFullname: z.string().nullable().optional(),
  loanReference: z.string().nullable().optional(),
});

export type LoanPaymentApi = z.infer<typeof loanPaymentApiSchema>;

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
  message: z.string(),
  paymentId: z.number(),
});
