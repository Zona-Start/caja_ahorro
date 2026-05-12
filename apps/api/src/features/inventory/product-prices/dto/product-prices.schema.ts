import { z } from 'zod';

export const CreateProductPriceSchema = z.object({
  productId: z.string().uuid('Product ID inválido'),
  suppliersId: z.string().uuid().optional(),
  priceType: z.enum(['COST', 'SELLING', 'OFFER']),
  baseCost: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0),
  ),
  otherCosts: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(0),
  ),
  purchaseTax: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  saleTax: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  profitPercent: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  supplierInvoiceId: z.string().uuid().optional(),
});

export const UpdateProductPriceSchema = CreateProductPriceSchema.partial();

export type CreateProductPriceDto = z.infer<typeof CreateProductPriceSchema>;
export type UpdateProductPriceDto = z.infer<typeof UpdateProductPriceSchema>;
