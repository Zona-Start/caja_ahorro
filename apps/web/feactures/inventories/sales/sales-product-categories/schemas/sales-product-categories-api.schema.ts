import { z } from 'zod';

export const salesProductCategoryApiSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
});

export type SalesProductCategorySchemaAPI = z.infer<
  typeof salesProductCategoryApiSchema
>;

export const salesProductCategoryMutationResponseSchema = z.object({
  message: z.string(),
});

export const salesProductCategoryAllResponseSchema = z.object({
  data: z.array(salesProductCategoryApiSchema),
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

export const salesProductCategoryResponse = z.array(
  salesProductCategoryApiSchema,
);
