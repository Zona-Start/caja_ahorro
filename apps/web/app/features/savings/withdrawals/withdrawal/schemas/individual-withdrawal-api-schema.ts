import { z } from 'zod';

export const withdrawalAssociate = z.object({
  id: z.number(),
  cedula: z.string(),
  fullname: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  isPayrollCredit: z.boolean(),
  associateAccountId: z.number(),
  accountNumber: z.string(),
  balance: z.string(),
  withdrawalId: z.number().nullable(),
  withdrawalRequestAmout: z.string().nullable(),
  withdrawalDate: z.string().nullable(),
  withdrawalStatus: z.string().nullable(),
  totalLoansAssociate: z.number().nullable().optional(),
  totalCreditsAssociate: z.number().nullable().optional(),
});

export type AssociatesWithdrawal = z.infer<typeof withdrawalAssociate>;
