import { z } from 'zod';

export const withdrawalApiSchema = z.object({
  id: z.number().optional(),
  customReference: z.string(),
  withdrawalTypeId: z.number(),
  withdrawalType: z.string(),
  withdrawalDate: z.string(),
  requestedAmount: z.string(),
  associateCedula: z.string(),
  associateFullname: z.string(),
  status: z.string(),
  isHouseComercial: z.boolean(),
  isInternalInventory: z.boolean(),
});

export type WithdrawalPaymentApi = z.infer<typeof withdrawalApiSchema>;

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
  withdrawalLimitQuantity: z.number().nullable(),
  minimumAntiquityDays: z.number().nullable(),
  isHouseComercial: z.boolean(),
  isInternalInventory: z.boolean(),
});

export type WithdrawalType = z.infer<typeof withdrawalTypeApiSchema>;

export const withdrawalTypeApiResponseSchema = z.object({
  message: z.string(),
  data: z.array(withdrawalTypeApiSchema),
});
