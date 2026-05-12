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
});

export const loadAssociateApiResponseSchema = z.object({
  associate: loadAssociate,
  totalCredits: z.number(),
  totalLoans: z.number(),
});

export type AssociatesLoan = z.infer<typeof loadAssociateApiResponseSchema>;
