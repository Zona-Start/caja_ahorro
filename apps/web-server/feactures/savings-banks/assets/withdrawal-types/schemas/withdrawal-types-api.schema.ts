import { z } from 'zod';

export const withdrawalTypesApiSchema = z.object({
  id: z.number().optional(),
  description: z.string(),
  withdrawalPercentage: z.string(),
  // accountDebit: z.number(),
  // expenseAccount: z.number(),
  administrativeFeePercentage: z.string(),
  withdrawalLimitQuantity: z.string().optional().nullable(),
  minimumAntiquityDays: z.string().optional().nullable(),
  withdrawalFrequencyRelation: z.number(),
  isHouseComercial: z.boolean(),
  isInternalInventory: z.boolean(),
});

// Define el tipo TypesLoan basado en el esquema de Zod
export type WithdrawalTypesSchemaAPI = z.infer<typeof withdrawalTypesApiSchema>;

// Response schemas for the API delete
export const withdrawalTypesMutationResponseSchema = z.object({
  message: z.string(),
});

// Update the paginated response schema to use the API schema
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
