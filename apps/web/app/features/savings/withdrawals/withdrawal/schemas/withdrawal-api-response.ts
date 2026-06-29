import { z } from 'zod';

export const withdrawalApiSchema = z.object({
  id: z.string(),
  customReference: z.string(),
  withdrawalTypeId: z.string(),
  withdrawalType: z.string(),
  withdrawalDate: z.string(),
  requestedAmount: z.string(),
  disbursedAmount: z.string().nullable().optional(),
  administrativeFee: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
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
      totalItems: z.number(),
      itemCount: z.number(),
      itemsPerPage: z.number(),
      totalPages: z.number(),
      currentPage: z.number(),
    })
    .optional(),
});

export const withdrawalMutationSchema = z.object({
  message: z.string().optional(),
});

export const withdrawalTypeApiSchema = z.object({
  id: z.string(),
  description: z.string(),
  withdrawalPercentage: z.string(),
  administrativeFeePercentage: z.string(),
  withdrawalLimitQuantity: z.number().nullable(),
  minimumAntiquityDays: z.number().nullable(),
  isHouseComercial: z.boolean(),
  isInternalInventory: z.boolean(),
  accountDebit: z.string().nullable().optional(),
  expenseAccount: z.string().nullable().optional(),
});

export type WithdrawalType = z.infer<typeof withdrawalTypeApiSchema>;

export const withdrawalTypeApiResponseSchema = z.object({
  data: z.array(withdrawalTypeApiSchema),
  meta: z
    .object({
      totalItems: z.number(),
      itemCount: z.number(),
      itemsPerPage: z.number(),
      totalPages: z.number(),
      currentPage: z.number(),
    })
    .optional(),
});
