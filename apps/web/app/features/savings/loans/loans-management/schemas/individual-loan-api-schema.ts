import { z } from 'zod';

export const loadAssociate = z.object({
  id: z.number(),
  cedula: z.string(),
  fullname: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  dateAdmission: z.string(),
  isPayrollCredit: z.boolean(),
  associateAccountId: z.number(),
  accountNumber: z.string(),
  balance: z.string(),
  baseSalary: z.string().nullable().optional(),
  paymentCapacity: z.string().nullable().optional(),
  requestedAprrobed: z.string().nullable().optional(),
});

export const loadAssociateApiResponseSchema = z.object({
  associate: loadAssociate,
  totalLoans: z.number(),
  totalCredits: z.number(),
});

export type AssociatesLoan = z.infer<typeof loadAssociateApiResponseSchema>;
export type LoadAssociateData = z.infer<typeof loadAssociate>;
