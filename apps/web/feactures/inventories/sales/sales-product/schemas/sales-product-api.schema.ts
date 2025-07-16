import { z } from 'zod';

export const salesProductApiSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number(),
  categoryName: z.string(),
  productCode: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  brand: z.string(),
  model: z.string(),
  defaultPurchaseCost: z.string(),
  defaultSellingPrice: z.string(),
  currentStock: z.number(),
  minimumStockAlert: z.number(),
  status: z.string(),
});

export type SalesProductSchemaAPI = z.infer<typeof salesProductApiSchema>;

export const salesProductMutationResponseSchema = z.object({
  message: z.string(),
});

export const salesProductAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(salesProductApiSchema),
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

export const salesProductAllApiSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
});

export const salesProductResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(salesProductAllApiSchema),
});
