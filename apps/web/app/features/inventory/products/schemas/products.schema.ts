import { z } from 'zod';

export const productSupplierAssignmentSchema = z.object({
  suppliersId: z.string().uuid(),
  leadTimeDays: z.coerce.number().int().min(0).default(0),
  name: z.string().optional(),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  sku: z.string().optional(),
  stockMin: z.coerce.number().min(0, 'El stock mínimo debe ser >= 0').default(0),
  stockMax: z.coerce.number().min(0, 'El stock máximo debe ser >= 0').default(0),
  reorderPoint: z.coerce.number().min(0, 'El punto de reorden debe ser >= 0').default(0),
  status: z.enum(['AVAILABLE', 'DISABLED', 'OUT_OF_STOCK', 'COMMING_SOON', 'ON_SALE']).default('COMMING_SOON'),
  unitOfMeasure: z.enum(['UNIT', 'KG', 'LITER', 'METER', 'PACK', 'BOX']).default('UNIT'),

  // Moneda y tasas
  currencyCode: z.enum(['VES', 'USD', 'EUR']).default('VES'),
  purchaseExchangeRate: z.coerce.number().min(0).default(1).transform(v => Math.round(v * 100) / 100),
  salesExchangeRate: z.coerce.number().min(0).default(1).transform(v => Math.round(v * 100) / 100),

  // Costos
  supplierCost: z.coerce.number().min(0, 'El costo de proveedor debe ser >= 0').default(0),
  otherCosts: z.coerce.number().min(0, 'Los otros costos deben ser >= 0').default(0),
  purchaseTaxPercent: z.coerce.number().min(0, 'El impuesto de compra debe ser >= 0').default(16),

  // Venta
  profitSale: z.coerce.number().min(0, 'La ganancia de venta debe ser >= 0').default(0),
  expensePercent: z.coerce.number().min(0, 'El % de gastos debe ser >= 0').default(0),
  salesTaxPercent: z.coerce.number().min(0, 'El impuesto de venta debe ser >= 0').default(16),

  // Precio directo en divisa (para moneda extranjera, sin cálculo por margen)
  salePrice: z.coerce.number().min(0).optional(),
  // Precio en divisa para conversión a VES (pago en Bs.)
  bsPriceAmount: z.coerce.number().min(0).optional(),

  // Oferta
  profitSupply: z.coerce.number().min(0, 'La ganancia de suministro debe ser >= 0').optional(),
  offerSalePrice: z.coerce.number().min(0).optional(),
  offerStartDate: z.string().optional(),
  offerEndDate: z.string().optional(),

  // Proveedores asignados (frontend-only, no enviado al API de productos)
  suppliers: z.array(productSupplierAssignmentSchema).optional().default([]),
});

export type Product = z.infer<typeof productSchema>;
export type ProductSupplierAssignment = z.infer<typeof productSupplierAssignmentSchema>;
