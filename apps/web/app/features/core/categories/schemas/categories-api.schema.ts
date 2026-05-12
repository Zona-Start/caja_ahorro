import { z } from 'zod';
import { categorySchema } from './categories.schema';

export const categoriesMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const categoriesListResponseSchema = z.object({
  data: z.array(categorySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const categoryResponseSchema = z.object({
  message: z.string(),
});

export type CategoriesMeta = z.infer<typeof categoriesMetaSchema>;
export type CategoriesListResponse = z.infer<typeof categoriesListResponseSchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;