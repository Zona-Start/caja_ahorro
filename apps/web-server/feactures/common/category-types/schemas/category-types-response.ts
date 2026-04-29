import { z } from 'zod';
import { categoryTypesSchema } from './category-types-schemas';

// Response schemas for the API
export const categoryTypesResponseSchema = z.object({
  message: z.string(),
  data: categoryTypesSchema,
});

export const categoryTypesDeleteResponseSchema = z.object({
  message: z.string(),
});

export const categoryTypesListResponseSchema = z.object({
  message: z.string(),
  data: z.array(categoryTypesSchema),
});

export const categoryTypesPaginationResponseSchema = z.object({
  message: z.string(),
  data: z.array(categoryTypesSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPage: z.number().nullable(),
    previousPage: z.number().nullable(),
  }),
});
