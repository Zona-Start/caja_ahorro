import { z } from 'zod';

export const settlementAssociate = z.object({
  associate_id: z.string(),
  fullname: z.string(),
  cedula: z.string(),
  admission_date: z.string(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  is_payroll_credit: z.boolean(),
  associate_account_id: z.string(),
  account_number: z.string(),
  total_savings_balance: z.number(),
  haberes_contribution: z.number(),
  haberes_voluntary: z.number(),
  haberes_employer: z.number(),
  surpluses: z.number(),
  total_withdrawals: z.number(),
  total_withdrawal_fees: z.number(),
  total_outstanding_loans: z.number(),
  total_outstanding_credits: z.number(),
  net_liquidation_amount: z.number(),
});

export type AssociatesSettlement = z.infer<typeof settlementAssociate>;
