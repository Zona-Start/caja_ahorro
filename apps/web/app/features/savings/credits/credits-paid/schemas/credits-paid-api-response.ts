import { z } from 'zod';

export const creditPaymentApiSchema = z.object({
  id: z.string(),
  customReference: z.string().nullable(),
  creditId: z.string(),
  paymentDate: z.string(),
  paymentType: z.string(),
  amount: z.string(),
  bankId: z.string().nullable(),
  bankAccountName: z.string().nullable(),
  bankAccountNumber: z.string().nullable(),
  paymentMethod: z.string(),
  transactionReference: z.string().nullable(),
  balancePending: z.string(),
  comment: z.string().nullable(),
  status: z.string().nullable(),
  creditCustomReference: z.string().nullable(),
  associateCedula: z.string().nullable(),
  associateFullname: z.string().nullable(),
});

export const creditPaymentApiResponseSchema = z.object({
  data: z.array(creditPaymentApiSchema),
  meta: z.object({
    totalItems: z.number(),
    itemCount: z.number(),
    itemsPerPage: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
  }),
});

export const creditPaymentMutationSchema = z.object({
  message: z.string(),
});

export const creditPaymentByIdResponseSchema = z.object({
  id: z.string(),
  customReference: z.string().nullable(),
  creditId: z.string(),
  paymentDate: z.string(),
  paymentType: z.string(),
  amount: z.string(),
  bankId: z.string().nullable(),
  bankAccountName: z.string().nullable(),
  bankAccountNumber: z.string().nullable(),
  paymentMethod: z.string(),
  transactionReference: z.string().nullable(),
  balancePending: z.string(),
  comment: z.string().nullable(),
  status: z.string().nullable(),
  creditCustomReference: z.string().nullable(),
  associateCedula: z.string().nullable(),
  associateFullname: z.string().nullable(),
  details: z.array(z.object({
    id: z.string(),
    amount: z.string(),
    installmentNumber: z.number().nullable(),
    dueDate: z.string().nullable(),
    totalInstallmentAmount: z.string().nullable(),
    principalAmount: z.string().nullable(),
    interestAmount: z.string().nullable(),
  })).optional(),
});

export const creditPaymentDeleteResponseSchema = z.object({
  message: z.string(),
});

export const creditPaymentBulkResponseSchema = z.object({
  success: z
    .array(z.object({ cedula: z.string(), ref: z.string().nullable().optional() }))
    .optional(),
  errors: z
    .array(z.object({ cedula: z.string(), error: z.string() }))
    .optional(),
  totalProcessed: z.coerce.number().optional(),
  accountingWarning: z.string().optional(),
});

export type CreditPaymentApi = z.infer<typeof creditPaymentApiSchema>;
export type CreditPaymentApiResponse = z.infer<typeof creditPaymentApiResponseSchema>;
export type CreditPaymentMutationResponse = z.infer<typeof creditPaymentMutationSchema>;
export type CreditPaymentByIdResponse = z.infer<typeof creditPaymentByIdResponseSchema>;
export type CreditPaymentDeleteResponse = z.infer<typeof creditPaymentDeleteResponseSchema>;
export type CreditPaymentBulkResponse = z.infer<typeof creditPaymentBulkResponseSchema>;
