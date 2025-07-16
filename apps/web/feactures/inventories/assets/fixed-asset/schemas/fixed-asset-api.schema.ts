import { z } from 'zod';

export const fixedAssetApiSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number(),
  categoryName: z.string(),
  assetCode: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  serialNumber: z.string(),
  brand: z.string(),
  model: z.string(),
  purchasePrice: z.number(),
  acquisitionDate: z.string(),
  assetStatus: z.string(),
  usefulLifeYears: z.number(),
  depreciationMethod: z.string(),
  currentStock: z.number(),
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

export const fixedAssetAllApiSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const fixedAssetResponseAllSchema = z.object({
  message: z.string().optional(),
  data: z.array(fixedAssetAllApiSchema),
});
