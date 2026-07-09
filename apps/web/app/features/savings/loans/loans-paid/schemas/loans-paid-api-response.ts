import { z } from 'zod';

export const loanPaymentApiSchema = z.object({
  id: z.string(),
  customReference: z.string().nullable(),
  loanId: z.string().nullable(),
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
  paymentStatus: z.string().nullable(),
  loanCustomReference: z.string().nullable(),
  associateCedula: z.string().nullable(),
  associateFullname: z.string().nullable(),
});

export const loanPaymentApiResponseSchema = z.object({
  data: z.array(loanPaymentApiSchema),
  meta: z.object({
    totalItems: z.coerce.number(),
    itemCount: z.coerce.number(),
    itemsPerPage: z.coerce.number(),
    totalPages: z.coerce.number(),
    currentPage: z.coerce.number(),
  }),
});

export const loanPaymentMutationSchema = z.object({
  message: z.string(),
});

export const loanPaymentByIdResponseSchema = z.object({
  id: z.string(),
  customReference: z.string().nullable(),
  loanId: z.string().nullable(),
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
  loanCustomReference: z.string().nullable(),
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

export const loanPaymentDeleteResponseSchema = z.object({
  message: z.string(),
});

export type LoanPaymentApi = z.infer<typeof loanPaymentApiSchema>;
export type LoanPaymentApiResponse = z.infer<typeof loanPaymentApiResponseSchema>;
export type LoanPaymentMutationResponse = z.infer<typeof loanPaymentMutationSchema>;
export type LoanPaymentByIdResponse = z.infer<typeof loanPaymentByIdResponseSchema>;
export type LoanPaymentDeleteResponse = z.infer<typeof loanPaymentDeleteResponseSchema>;
