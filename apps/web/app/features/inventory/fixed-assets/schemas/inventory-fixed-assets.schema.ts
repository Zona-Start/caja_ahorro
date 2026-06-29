import { z } from 'zod';
import {
  FixedAssetStatus,
  DepreciationMethod,
} from './inventory-fixed-assets-options';

export const inventoryFixedAssetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  assetCode: z.string().max(50).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  acquisitionDate: z.coerce.date(),
  assetStatus: z
    .nativeEnum(FixedAssetStatus)
    .default(FixedAssetStatus.ACTIVE),
  usefulLifeYears: z.coerce
    .number()
    .int()
    .min(0, 'La vida útil no puede ser negativa')
    .default(0),
  depreciationMethod: z
    .nativeEnum(DepreciationMethod)
    .default(DepreciationMethod.STRAIGHT_LINE),
  accumulatedDepreciation: z.coerce.number().min(0).default(0),
  baseCost: z.coerce.number().min(0, 'El costo base no puede ser negativo'),
  otherCosts: z.coerce.number().min(0).default(0),
  purchaseTax: z.coerce.number().min(0).default(0),
  lastDepreciationDate: z.coerce.date().optional().nullable(),
  disposalDate: z.coerce.date().optional().nullable(),
  disposalReason: z.string().optional().nullable(),
  disposalValue: z.coerce.number().min(0).default(0).optional().nullable(),
  categoryName: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type InventoryFixedAsset = z.infer<
  typeof inventoryFixedAssetSchema
>;
