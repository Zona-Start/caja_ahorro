import { z } from 'zod';
import { categorySchema } from './categories.schema';

export const categoriesMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
});

export const categoriesPaginatedResponseSchema = z.object({
  data: z.array(categorySchema),
  meta: categoriesMetaSchema,
});

export const categoriesListResponseSchema = z.array(categorySchema);

export const categoryDeleteResponseSchema = z.object({
  message: z.string(),
});

export type CategoriesPaginatedResponse = z.infer<typeof categoriesPaginatedResponseSchema>;
