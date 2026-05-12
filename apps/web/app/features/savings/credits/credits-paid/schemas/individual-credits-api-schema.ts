import { z } from 'zod';

export const creditQuotasAssociate = z.object({
  quotaNumber: z.number(),
  dueDate: z.string(),
  amount: z.string(),
  principal: z.string(),
  interest: z.string(),
  balance: z.string(),
  status: z.string(),
});

export const creditAssociate = z.object({
  associateId: z.number(),
  fullname: z.string(),
  cedula: z.string(),
  accountNumber: z.string(),
  balance: z.string(),
  isPayrollCredit: z.boolean(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  dateAdmission: z.string().nullable(),
});

export const associatesCreditSchema = z.object({
  associate: creditAssociate,
  creditId: z.number(),
  creditTypeId: z.number(),
  creditModality: z.string(),
  requestedAmount: z.string(),
  approvedAmount: z.string(),
  interestRate: z.string(),
  termMonths: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  status: z.string(),
  outstandingBalance: z.string(),
  totalPaid: z.string(),
  nextPaymentDate: z.string().nullable(),
  installmentAmount: z.string(),
  installmentsCount: z.number(),
  installmentsPaid: z.number(),
  installmentsPending: z.number(),
  creditCustomReference: z.string().nullable(),
  creditTypeName: z.string().nullable(),
  quotas: z.array(creditQuotasAssociate).nullable(),
  totalCredits: z.number().optional(),
  totalLoans: z.number().optional(),
});

export type CreditQuotasAssociate = z.infer<typeof creditQuotasAssociate>;
export type CreditAssociate = z.infer<typeof creditAssociate>;
export type AssociatesCredit = z.infer<typeof associatesCreditSchema>;

export const associateCreditResponseSchema = z.object({
  message: z.string(),
  data: associatesCreditSchema,
});

export type AssociateCreditResponse = z.infer<typeof associateCreditResponseSchema>;
