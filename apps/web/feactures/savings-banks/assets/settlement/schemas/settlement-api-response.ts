import { z } from 'zod';

// Esquema de validación para el registro de pagos
export const settlementApiSchema = z.object({
  id: z.number().optional(),
  customReference: z.string(),
  withdrawalTypeId: z.number(),
  withdrawalType: z.string(),
  withdrawalDate: z.string(),
  requestedAmount: z.string(),
  associateCedula: z.string(),
  associateFullname: z.string(),
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
  netAmount: z.number(),
});
