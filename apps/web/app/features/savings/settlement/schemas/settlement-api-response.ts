import { z } from 'zod';

export const beneficiaryApiSchema = z.object({
  fullname: z.string().optional(),
  cedula: z.string().optional(),
  phone: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankId: z.string().optional(),
}).nullable().optional();

export const settlementApiSchema = z.object({
  id: z.string(),
  customReference: z.string().nullable(),
  liquidationDate: z.string(),
  totalSavingsBalanceAtLiquidation: z.string(),
  totalOutstandingLoansAtLiquidation: z.string(),
  totalOutstandingCreditsAtLiquidation: z.string(),
  netLiquidationAmount: z.string(),
  associateCedula: z.string(),
  associateFullname: z.string(),
  status: z.string(),
  notes: z.string().nullable().optional(),
  beneficiary: beneficiaryApiSchema,
});

export type SettlementPaymentApi = z.infer<typeof settlementApiSchema>;
