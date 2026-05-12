import { z } from 'zod';
import { loanTypeSchema } from './loan-types.schema';

export const loanTypesMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
});

export const loanTypesListResponseSchema = z.object({
  data: z.array(loanTypeSchema),
  meta: loanTypesMetaSchema,
});

export const loanTypeResponseSchema = z.object({
  message: z.string(),
});

export type LoanTypesMeta = z.infer<typeof loanTypesMetaSchema>;
export type LoanTypesListResponse = z.infer<typeof loanTypesListResponseSchema>;
export type LoanTypeResponse = z.infer<typeof loanTypeResponseSchema>;