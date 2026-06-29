import { z } from 'zod';

export const withdrawalAssociate = z.object({
  id: z.string(),
  cedula: z.string(),
  fullname: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  isPayrollCredit: z.boolean(),
  associateAccountId: z.string().nullable(),
  accountNumber: z.string(),
  balance: z.number(),
  available80: z.number(),
  hasActiveLoan: z.boolean(),
  hasActiveCredit: z.boolean(),
  hasPayrollCredit: z.boolean(),
  lastWithdrawalDate: z.string().nullable(),
  withdrawalTimeMonths: z.number(),
  totalLoansAssociate: z.number(),
  totalCreditsAssociate: z.number(),
});

export type AssociatesWithdrawal = z.infer<typeof withdrawalAssociate>;
