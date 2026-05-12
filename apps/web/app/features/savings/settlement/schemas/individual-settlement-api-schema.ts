import { z } from 'zod';

export const settlementAssociate = z.object({
  associate_id: z.number(),
  fullname: z.string(),
  cedula: z.string(),
  admission_date: z.string(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  is_payroll_credit: z.boolean(),
  associate_account_id: z.number(),
  account_number: z.string(),
  currency_code: z.string(),
  total_savings_balance: z.string(),
  haberes_contribution: z.string(),
  haberes_voluntary: z.string(),
  haberes_employer: z.string(),
  surpluses: z.string(),
  total_withdrawals: z.string(),
  total_withdrawal_fees: z.string(),
  total_outstanding_loans: z.string(),
  total_outstanding_credits: z.string(),
  net_liquidation_amount: z.string(),
});

export type AssociatesSettlement = z.infer<typeof settlementAssociate>;

export const associateLiquidationResponseSchema = z.object({
  message: z.string(),
  data: settlementAssociate,
});

export type AssociateLiquidationResponse = z.infer<
  typeof associateLiquidationResponseSchema
>;