import { z } from 'zod';

export const CreateFixedAssetPriceSchema = z.object({
  fixedAssetsId: z.string().uuid('Fixed Asset ID inválido'),
  suppliersId: z.string().uuid().optional(),
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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  supplierInvoiceId: z.string().uuid().optional(),
});

export const UpdateFixedAssetPriceSchema = CreateFixedAssetPriceSchema.partial();

export type CreateFixedAssetPriceDto = z.infer<typeof CreateFixedAssetPriceSchema>;
export type UpdateFixedAssetPriceDto = z.infer<typeof UpdateFixedAssetPriceSchema>;
