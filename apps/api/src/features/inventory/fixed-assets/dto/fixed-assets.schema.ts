import { z } from 'zod';

export const CreateFixedAssetSchema = z.object({
  categoryId: z.string().uuid('Category ID inválido'),
  assetCode: z.string().max(50).optional(),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().optional(),
  serialNumber: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  acquisitionDate: z.string().date().or(z.string().datetime()),
  assetStatus: z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE', 'DEREGISTERED']).default('ACTIVE'),
  usefulLifeYears: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(0).optional(),
  ),
  depreciationMethod: z.string().max(50).optional(),
  accumulatedDepreciation: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  lastDepreciationDate: z.string().date().or(z.string().datetime()).optional(),
  disposalDate: z.string().date().or(z.string().datetime()).optional(),
  disposalReason: z.string().optional(),
  disposalValue: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
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
});

export const UpdateFixedAssetSchema = CreateFixedAssetSchema.partial();

export type CreateFixedAssetDto = z.infer<typeof CreateFixedAssetSchema>;
export type UpdateFixedAssetDto = z.infer<typeof UpdateFixedAssetSchema>;
