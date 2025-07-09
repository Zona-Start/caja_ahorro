import { z } from 'zod';

export const fixedAssetCategoriesApiSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  defaultUsefulLifeYears: z.number().optional().nullable(),
  defaultDepreciationMethod: z.string().optional().nullable(),
});

export type FixedAssetCategoriesSchemaAPI = z.infer<
  typeof fixedAssetCategoriesApiSchema
>;

export const fixedAssetCategoriesMutationResponseSchema = z.object({
  message: z.string(),
});

export const fixedAssetCategoriesAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(fixedAssetCategoriesApiSchema),
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

export const fixedAssetCategoriesResponse = z.array(
  fixedAssetCategoriesApiSchema,
);
