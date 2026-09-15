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

// Los campos numéricos pueden llegar como string (columnas numeric de la DB) o
// como número (valores derivados calculados al vuelo por la API).
const numericField = z.union([z.string(), z.number()]).nullable().optional();

export const productPriceSchema = z.object({
  productPriceId: z.string(),
  priceType: z.string(),
  currencyCode: z.string().nullable().optional(),
  purchaseExchangeRate: numericField,
  salesExchangeRate: numericField,
  baseCost: numericField,
  otherCosts: numericField,
  purchaseTaxPercent: numericField,
  totalCost: numericField,
  baseCostVes: numericField,
  otherCostsVes: numericField,
  totalCostVes: numericField,
  expensePercent: numericField,
  profitPercent: numericField,
  salesTaxPercent: numericField,
  salePrice: numericField,
  offerSalePrice: numericField,
  bsPriceAmount: numericField,
  finalPriceNet: numericField,
  finalPriceGross: numericField,
  finalPriceNetVes: numericField,
  finalPriceGrossVes: numericField,
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
