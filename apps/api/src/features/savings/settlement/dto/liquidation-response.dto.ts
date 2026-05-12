// src/savings/dto/liquidation-response.dto.ts
import { z } from 'zod';

export const LiquidationResponseSchema = z.object({
  associate_id: z.string().uuid(),
  fullname: z.string(),
  cedula: z.string(),
  admission_date: z.coerce.date(), // Convierte automáticamente desde string ISO o Date
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  is_payroll_credit: z.boolean(),
  associate_account_id: z.string().uuid(),
  account_number: z.string(),
  currency_code: z.string(),
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

export type LiquidationResponseDto = z.infer<typeof LiquidationResponseSchema>;
