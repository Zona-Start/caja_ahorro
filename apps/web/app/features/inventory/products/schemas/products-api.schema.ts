import { z } from 'zod';
import { productSchema } from './products.schema';

export const productApiResponseSchema = z.object({
  data: productSchema,
});

export const productCreateResponseSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  status: z.string(),
});

export const productDeleteResponseSchema = z.unknown();

export const productListApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(productSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean().optional().nullable(),
      hasPreviousPage: z.boolean().optional().nullable(),
      nextPage: z.number().optional().nullable(),
      previousPage: z.number().optional().nullable(),
    })
    .nullable()
    .optional(),
});

export const productPriceSchema = z.object({
  productPriceId: z.string(),
  priceType: z.string(),
  currencyCode: z.string().nullable().optional(),
  purchaseExchangeRate: z.string().nullable().optional(),
  salesExchangeRate: z.string().nullable().optional(),
  baseCost: z.string().nullable().optional(),
  otherCosts: z.string().nullable().optional(),
  purchaseTaxPercent: z.string().nullable().optional(),
  totalCost: z.string().nullable().optional(),
  baseCostVes: z.string().nullable().optional(),
  otherCostsVes: z.string().nullable().optional(),
  totalCostVes: z.string().nullable().optional(),
  expensePercent: z.string().nullable().optional(),
  profitPercent: z.string().nullable().optional(),
  salesTaxPercent: z.string().nullable().optional(),
  salePrice: z.string().nullable().optional(),
  offerSalePrice: z.string().nullable().optional(),
  bsPriceAmount: z.string().nullable().optional(),
  finalPriceNet: z.string().nullable().optional(),
  finalPriceGross: z.string().nullable().optional(),
  finalPriceNetVes: z.string().nullable().optional(),
  finalPriceGrossVes: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export const productViewApiResponseSchema = z.object({
  dataProduct: z.object({
    id: z.string(),
    tenantId: z.string().nullable().optional(),
    internalCode: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    categoryName: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    brand: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    stockMin: z.number().nullable().optional(),
    stockMax: z.number().nullable().optional(),
    reorderPoint: z.number().nullable().optional(),
    status: z.string(),
    unitOfMeasure: z.string().nullable().optional(),
  }),
  dataProductPrices: z.array(productPriceSchema).nullable(),
  dataAvailable: z.unknown().nullable(),
});

export type ProductViewResponse = z.infer<typeof productViewApiResponseSchema>;
