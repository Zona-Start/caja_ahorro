import { z } from 'zod';

// Esquema de validación para el registro de pagos
export const withdrawalApiSchema = z.object({
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
export type WithdrawalPaymentApi = z.infer<typeof withdrawalApiSchema>;

// Esquema de respuesta para API (puedes ajustarlo según tu backend)
export const withdrawalApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(withdrawalApiSchema),
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

export const withdrawalMutationSchema = z.object({
  message: z.string().optional(),
});

export const withdrawalTypeApiSchema = z.object({
  id: z.number(),
  description: z.string(),
  withdrawalPercentage: z.string(),
  administrativeFeePercentage: z.string(),
  withdrawalLimitQuantity: z.number(),
  minimumAntiquityDays: z.number(),
});

export type WithdrawalType = z.infer<typeof withdrawalTypeApiSchema>;

export const withdrawalTypeApiResponseSchema = z.object({
  message: z.string(),
  data: z.array(withdrawalTypeApiSchema),
});
