import { z } from 'zod';

export const withdrawalTypesApiSchema = z.object({
  id: z.number().optional(),
  description: z.string(),
  withdrawalPercentage: z.string(),
  administrativeFeePercentage: z.string(),
  withdrawalLimitQuantity: z.string().optional().nullable(),
  minimumAntiquityDays: z.string().optional().nullable(),
  withdrawalFrequencyRelation: z.number(),
  isHouseComercial: z.boolean(),
  isInternalInventory: z.boolean(),
});

export type WithdrawalTypesSchemaAPI = z.infer<typeof withdrawalTypesApiSchema>;

export const withdrawalTypesMutationResponseSchema = z.object({
  message: z.string(),
});

export const withdrawalTypesAllResponseSchema = z.object({
  data: z.array(withdrawalTypesApiSchema),
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
