import { z } from 'zod';

export const loadAssociate = z.object({
  id: z.number(),
  cedula: z.string(),
  fullname: z.string(),
  phone: z.string(),
  email: z.string(),
  dateAdmission: z.string(),
  isPayrollCredit: z.boolean(),
  associateAccountId: z.number(),
  accountNumber: z.string(),
  balance: z.string(),
});

// Esquema de validación para el formulario
export const loadAssociateApiResponseSchema = z.object({
  associate: loadAssociate,
  totalCredits: z.number(),
  totalLoans: z.number(),
});

export type AssociatesLoan = z.infer<typeof loadAssociateApiResponseSchema>;
