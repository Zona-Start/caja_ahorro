import { z } from 'zod';

export const productApiSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number(),
  categoryName: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  brand: z.string(),
  model: z.string(),
  stockMin: z.number(),
  stockMax: z.number(),
  reorderPoint: z.number(),
  status: z.string(),
  totalCost: z.string().nullable(),
  finalPrice: z.string().nullable(),
  available: z.number().nullable(),
});

export type ProductSchemaAPI = z.infer<typeof productApiSchema>;

export const productMutationDeleteResponseSchema = z.object({
  message: z.string(),
});

export const productAllResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(productApiSchema),
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

export const productAllApiSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
});

export const productResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(productAllApiSchema),
});

export const productMutationResponseObjetSchema = z.object({
  id: z.number(),
  sku: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
});

export const productMutationResponseSchema = z.object({
  message: z.string().optional(),
  data: productMutationResponseObjetSchema,
});

export const getProductsResponseSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number(),
  categoryName: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  brand: z.string(),
  model: z.string(),
  stockMin: z.number(),
  stockMax: z.number(),
  reorderPoint: z.number(),
  status: z.string(),
  unitType: z.string().optional().nullable(),
});

export const getProductPriceSchema = z.object({
  productPriceId: z.number().nullable(),
  priceType: z.string().nullable(),
  baseCost: z.string().nullable(),
  otherCosts: z.string().nullable(),
  purchaseTax: z.string().nullable(),
  totalCost: z.string().nullable(),
  expensePercent: z.string().nullable(),
  profitPercent: z.string().nullable(),
  salesTaxPercent: z.string().nullable(),
});

export type GetProductPrice = z.infer<typeof getProductPriceSchema>;

export const getProductPriceResponseArraySchema = z.array(
  getProductPriceSchema,
);

export const getproductAvailable = z.object({
  itemId: z.number(),
  itemType: z.string(),
  availableQuantity: z.number(),
});

export const getProductApiSchema = z.object({
  dataProduct: getProductsResponseSchema,
  dataProductPrices: getProductPriceResponseArraySchema,
  dataAvailable: getproductAvailable.nullable(),
});
export const getOneProductResponseApiSchema = z.object({
  message: z.string().optional(),
  data: getProductApiSchema,
});
