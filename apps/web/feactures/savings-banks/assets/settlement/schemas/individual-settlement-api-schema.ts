import { z } from 'zod';

export const settlementAssociate = z.object({
  associate_id: z.number(),
  fullname: z.string(),
  cedula: z.string(),
  admission_date: z.string(), // Mantener como string si el backend lo envía así (ej. "YYYY-MM-DD")
  phone: z.string().nullable(),
  email: z.string().email().nullable(), // Añadir validación de email
  is_payroll_credit: z.boolean(),
  associate_account_id: z.number(),
  account_number: z.string(),
  currency_code: z.string(), // Asumiendo que es un string como "VES"
  total_savings_balance: z.string(), // Backend lo envía como string, lo mantendremos así
  haberes_contribution: z.string(),
  haberes_voluntary: z.string(),
  haberes_employer: z.string(),
  surpluses: z.string(),
  total_withdrawals: z.string(),
  total_withdrawal_fees: z.string(),
  total_outstanding_loans: z.string(), // Backend lo envía como string
  total_outstanding_credits: z.string(), // Backend lo envía como string
  net_liquidation_amount: z.string(), // Backend lo envía como string
});

export type AssociatesSettlement = z.infer<typeof settlementAssociate>;

export const associateLiquidationResponseSchema = z.object({
  message: z.string(),
  data: settlementAssociate, // Aquí anidamos el esquema de datos
});

// Tipo inferido del esquema de respuesta completa
export type AssociateLiquidationResponse = z.infer<
  typeof associateLiquidationResponseSchema
>;
