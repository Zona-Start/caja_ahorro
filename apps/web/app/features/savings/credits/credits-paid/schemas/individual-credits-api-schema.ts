import { z } from 'zod';

export const creditAmortizationItemSchema = z.object({
  id: z.string(),
  quotaNumber: z.number(),
  quotaAmount: z.string(),
  quotaDate: z.string(),
  quotaStatus: z.string(),
  quotaPartial: z.string().nullable(),
  principalBalancePending: z.string().nullable(),
  paidAmount: z.string().nullable(),
});

export const associatesCreditSchema = z.object({
  id: z.string(),
  cedula: z.string(),
  fullname: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  accountNumber: z.string().nullable(),
  balance: z.string().nullable(),
  creditId: z.string().nullable(),
  creditType: z.string().nullable(),
  creditTotalAmount: z.string(),
  creditModality: z.string().nullable(),
  creditCustomReference: z.string().nullable(),
  creditRequestedAmount: z.string().nullable(),
  creditAmortization: z.array(creditAmortizationItemSchema).nullable(),
});

export type CreditAmortizationItem = z.infer<typeof creditAmortizationItemSchema>;
export type AssociatesCredit = z.infer<typeof associatesCreditSchema>;
