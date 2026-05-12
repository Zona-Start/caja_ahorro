import { z } from 'zod';

export const CreateProductSchema = z.object({
  categoryId: z.string().uuid('Category ID inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  stockMin: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(0).default(0),
  ),
  stockMax: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(0).default(0),
  ),
  reorderPoint: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(0).default(0),
  ),
  status: z.enum(['AVAILABLE', 'DISABLED', 'OUT_OF_STOCK', 'COMMING_SOON', 'ON_SALE']).default('DISABLED'),
  unitOfMeasure: z.enum(['UNIT', 'KILOGRAM', 'LITER', 'METER', 'BOX', 'PACK']).optional(),
  supplierCost: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0),
  ),
  otherCosts: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).default(0),
  ),
  profitSale: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  profitSupply: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  purchaseTax: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
  saleTax: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).optional(),
  ),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProductDto = z.infer<typeof CreateProductSchema>;
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;
