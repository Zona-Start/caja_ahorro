import { z } from 'zod';

export const CreateProductPriceSchema = z.object({
  productId: z.string().uuid('Product ID inválido'),
  suppliersId: z.string().uuid().optional().nullable(),
  priceType: z.enum(['COST', 'SELLING', 'OFFER']),

  // Moneda y tasas
  currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
  purchaseExchangeRate: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(1),
  ),
  salesExchangeRate: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(1),
  ),

  // Costos
  baseCost: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0),
  ),
  otherCosts: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(0),
  ),
  purchaseTaxPercent: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(16),
  ),

  // Venta
  profitPercent: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(0),
  ),
  expensePercent: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(0),
  ),
  salesTaxPercent: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(16),
  ),

  // Precio directo en divisa (moneda extranjera, sin cálculo por margen)
  salePrice: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  // Precio oferta directo en divisa (moneda extranjera)
  offerSalePrice: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  // Precio en divisa para conversión a VES (pago en Bs.)
  bsPriceAmount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),

  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  supplierInvoiceId: z.string().uuid().optional().nullable(),
});

export const UpdateProductPriceSchema = CreateProductPriceSchema.partial();

export type CreateProductPriceDto = z.infer<typeof CreateProductPriceSchema>;
export type UpdateProductPriceDto = z.infer<typeof UpdateProductPriceSchema>;
