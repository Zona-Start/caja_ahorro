import { z } from 'zod';
import {
  withdrawalTypeMutationApiSchema,
  withdrawalTypeSchema,
} from './withdrawal-types.schema';

export const withdrawalTypesMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean().optional().nullable(),
  hasPreviousPage: z.boolean().optional().nullable(),
  nextPage: z.number().nullable().optional(),
  previousPage: z.number().nullable().optional(),
});

export const withdrawalTypesListResponseSchema = z.object({
  data: z.array(withdrawalTypeSchema),
  meta: withdrawalTypesMetaSchema,
});

export const withdrawalTypeResponseSchema = z.object({
  data: withdrawalTypeMutationApiSchema,
  message: z.string(),
});

export type WithdrawalTypesMeta = z.infer<typeof withdrawalTypesMetaSchema>;
export type WithdrawalTypesListResponse = z.infer<
  typeof withdrawalTypesListResponseSchema
>;
export type WithdrawalTypeResponse = z.infer<
  typeof withdrawalTypeResponseSchema
>;
