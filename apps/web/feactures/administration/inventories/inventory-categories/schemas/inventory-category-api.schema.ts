import { z } from 'zod';

export const inventoryCategoryApiSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  group: z.string(),
  description: z.string().optional().nullable(),
});

export type InventoryCategorySchemaAPI = z.infer<
  typeof inventoryCategoryApiSchema
>;

export const inventoryCategoryMutationResponseSchema = z.object({
  message: z.string(),
});

export const inventoryCategoryAllResponseSchema = z.object({
  data: z.array(inventoryCategoryApiSchema),
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

export const inventoryCategoryResponse = z.array(
  inventoryCategoryApiSchema,
);
