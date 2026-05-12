import { z } from 'zod';
import { creditTypeSchema } from './credit-types.schema';

export const creditTypesMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
});

export const creditTypesListResponseSchema = z.object({
  data: z.array(creditTypeSchema),
  meta: creditTypesMetaSchema,
});

export const creditTypeResponseSchema = z.object({
  message: z.string(),
});

export type CreditTypesMeta = z.infer<typeof creditTypesMetaSchema>;
export type CreditTypesListResponse = z.infer<typeof creditTypesListResponseSchema>;
export type CreditTypeResponse = z.infer<typeof creditTypeResponseSchema>;