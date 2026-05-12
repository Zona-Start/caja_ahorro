import { z } from 'zod';

export const loanQuotaAssociateSchema = z.object({
  id: z.number(),
  loanId: z.number(),
  installmentNumber: z.number(),
  dueDate: z.string(),
  principalAmount: z.string(),
  interestAmount: z.string(),
  totalInstallmentAmount: z.string(),
  principalBalancePending: z.string(),
  paymentStatus: z.string(),
  paidAmount: z.string().nullable(),
  lastPaymentDate: z.string().nullable(),
});

export type LoanQuotasAssociate = z.infer<typeof loanQuotaAssociateSchema>;

export const loanAssociateSchema = z.object({
  id: z.number(),
  cedula: z.string(),
  fullname: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  isPayrollCredit: z.boolean(),
  associateAccountId: z.number(),
  accountNumber: z.string(),
  balance: z.string(),
  totalLoans: z.number(),
  totalCredits: z.number(),
});

export type LoanAssociate = z.infer<typeof loanAssociateSchema>;

export const associatesLoanApiResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    associate: loanAssociateSchema,
    loanQuotas: z.array(loanQuotaAssociateSchema),
    loanSummary: z.object({
      loanId: z.number(),
      loanReference: z.string(),
      totalAmount: z.string(),
      pendingBalance: z.string(),
      installmentsCount: z.number(),
      paidInstallments: z.number(),
      pendingInstallments: z.number(),
    }),
  }),
});

export type AssociatesLoan = z.infer<typeof associatesLoanApiResponseSchema>['data'];
