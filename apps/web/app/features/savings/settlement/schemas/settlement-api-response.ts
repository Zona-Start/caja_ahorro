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

export const settlementBulkResponseSchema = z.object({
  message: z.string().optional(),
  totalProcessed: z.number(),
  totalDisbursed: z.number().optional(),
  totalErrors: z.number().optional(),
  bankMovementCreated: z.boolean().optional(),
  success: z
    .array(
      z.object({
        cedula: z.string(),
        customReference: z.string().nullable().optional(),
        liquidationId: z.string().optional(),
        disbursed: z.boolean().optional(),
        disburseError: z.string().optional(),
      }),
    )
    .optional(),
  errors: z.array(
    z.object({
      cedula: z.string(),
      error: z.string(),
    }),
  ),
});

export type SettlementBulkResponse = z.infer<
  typeof settlementBulkResponseSchema
>;
