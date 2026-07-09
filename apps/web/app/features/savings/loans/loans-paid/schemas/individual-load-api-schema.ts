import { z } from 'zod';

export const loanAmortizationItemSchema = z.object({
  id: z.string(),
  quotaNumber: z.number(),
  quotaAmount: z.string(),
  quotaDate: z.string(),
  quotaStatus: z.string(),
  quotaPartial: z.string().nullable(),
  principalBalancePending: z.string().nullable(),
  paidAmount: z.string().nullable(),
});

export const associatesLoanSchema = z.object({
  id: z.string(),
  cedula: z.string(),
  fullname: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  accountNumber: z.string().nullable(),
  balance: z.string().nullable(),
  loanId: z.string().nullable(),
  loanType: z.string().nullable(),
  loanTotalAmount: z.string(),
  loanModality: z.string().nullable(),
  loanCustomReference: z.string().nullable(),
  loanRequestedAmount: z.string().nullable(),
  loanAmortization: z.array(loanAmortizationItemSchema).nullable(),
  loanStatus: z.string().nullable(),
});

export type LoanAmortizationItem = z.infer<typeof loanAmortizationItemSchema>;
export type AssociatesLoan = z.infer<typeof associatesLoanSchema>;
