import { z } from 'zod';

export const fixedAssetApiSchema = z.object({
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

export type FixedAssetSchemaAPI = z.infer<typeof fixedAssetApiSchema>;

export const fixedAssetMutationResponseSchema = z.object({
  message: z.string(),
});

export const fixedAssetAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(fixedAssetApiSchema),
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
