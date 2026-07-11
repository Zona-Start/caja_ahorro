import { z } from 'zod';

const supplierSchema = z.object({
  suppliersId: z.string().uuid('Supplier ID inválido'),
  leadTimeDays: z.number().int().min(0).default(0).optional(),
  preferred: z.boolean().default(false).optional(),
});

export const CreateFixedAssetSchema = z.object({
  categoryId: z.string().uuid('Category ID inválido'),
  assetCode: z.string().max(50).optional().nullable(),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  acquisitionDate: z.string().date().or(z.string().datetime()),
  assetStatus: z
    .enum(['ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE', 'DEREGISTERED'])
    .default('ACTIVE')
    .optional()
    .nullable(),
  usefulLifeYears: z.preprocess(
    (val) =>
      typeof val === 'string'
        ? parseInt(val, 10)
        : val === null
          ? undefined
          : val,
    z.number().int().min(0).optional().nullable(),
  ),
  depreciationMethod: z.string().max(50).optional().nullable(),
  accumulatedDepreciation: z.preprocess(
    (val) =>
      typeof val === 'string'
        ? parseFloat(val)
        : val === null
          ? undefined
          : val,
    z.number().min(0).optional().nullable(),
  ),
  lastDepreciationDate: z
    .string()
    .date()
    .or(z.string().datetime())
    .optional()
    .nullable(),
  disposalDate: z
    .string()
    .date()
    .or(z.string().datetime())
    .optional()
    .nullable(),
  disposalReason: z.string().optional().nullable(),
  disposalValue: z.preprocess(
    (val) =>
      typeof val === 'string'
        ? parseFloat(val)
        : val === null
          ? undefined
          : val,
    z.number().min(0).optional().nullable(),
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
    (val) =>
      typeof val === 'string'
        ? parseFloat(val)
        : val === null
          ? undefined
          : val,
    z.number().min(0).optional().nullable(),
  ),
  suppliers: z.array(supplierSchema).optional().nullable(),
});

export const UpdateFixedAssetSchema = CreateFixedAssetSchema.partial();

export type CreateFixedAssetDto = z.infer<typeof CreateFixedAssetSchema>;
export type UpdateFixedAssetDto = z.infer<typeof UpdateFixedAssetSchema>;
