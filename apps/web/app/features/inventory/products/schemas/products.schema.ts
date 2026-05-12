import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  stockMin: z.coerce.number().min(0, 'El stock mínimo debe ser >= 0').default(0),
  stockMax: z.coerce.number().min(0, 'El stock máximo debe ser >= 0').default(0),
  reorderPoint: z.coerce.number().min(0, 'El punto de reorden debe ser >= 0').default(0),
  status: z.enum(['AVAILABLE', 'DISABLED', 'OUT_OF_STOCK', 'COMMING_SOON', 'ON_SALE']).default('AVAILABLE'),
  unitOfMeasure: z.enum(['UNIT', 'KG', 'LITER', 'METER', 'PACK', 'BOX']).default('UNIT'),
  supplierCost: z.coerce.number().min(0, 'El costo de proveedor debe ser >= 0').default(0),
  otherCosts: z.coerce.number().min(0, 'Los otros costos deben ser >= 0').default(0),
  profitSale: z.coerce.number().min(0, 'La ganancia de venta debe ser >= 0').default(0),
  profitSupply: z.coerce.number().min(0, 'La ganancia de suministro debe ser >= 0').default(0),
  purchaseTax: z.coerce.number().min(0, 'El impuesto de compra debe ser >= 0').default(0),
  saleTax: z.coerce.number().min(0, 'El impuesto de venta debe ser >= 0').default(0),
});

export type Product = z.infer<typeof productSchema>;
