import { z } from 'zod';

// Esquema de validación para el registro de pagos
export const settlementApiSchema = z.object({
  id: z.number().optional(),
  customReference: z.string(),
  liquidationDate: z.string(),
  totalSavingsBalanceAtLiquidation: z.string(),
  totalOutstandingLoansAtLiquidation: z.string(),
  totalOutstandingCreditsAtLiquidation: z.string(),
  netLiquidationAmount: z.string(),
  associateCedula: z.string(),
  associateFullname: z.string(),
  status: z.string(),
});

// Tipo inferido
export type SettlementPaymentApi = z.infer<typeof settlementApiSchema>;

// Esquema de respuesta para API (puedes ajustarlo según tu backend)
export const settlementApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(settlementApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});

export const liquidationResponseSchema = z.object({
  id: z.number(),
  customReference: z.string().nullable(),
});

export const settlementMutationSchema = z.object({
  message: z.string().optional(),
  liquidation: liquidationResponseSchema,
});

export const approveSettlementResponseSchema = z.object({
  message: z.string(),
  liquidationId: z.number(),
});

export const disburseSettlementResponseSchema = z.object({
  message: z.string(),
  liquidationId: z.number(),
  bankTransactionId: z.number(),
});
