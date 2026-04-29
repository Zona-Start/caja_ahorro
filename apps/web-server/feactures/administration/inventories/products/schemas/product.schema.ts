import { z } from 'zod';

export const productSchema = z.object({
  id: z.number().nullable().optional(),
  categoryId: z.number({ required_error: 'La categoría es requerida' }),
  categoryName: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  name: z.string({ required_error: 'El nombre es requerido' }).min(1),
  description: z.string().optional().nullable(),
  brand: z.string({ required_error: 'La marca es requerida' }).min(1),
  model: z.string({ required_error: 'El modelo es requerido' }).min(1),
  status: z.string().optional(),
  unitType: z.enum(['UNIT', 'KILOGRAM', 'LITER', 'METER', 'BOX', 'PACK']),
  purchaseTax: z.number().optional(),
  saleTax: z.number().optional(),
  baseCost: z.coerce
    .number({
      required_error: 'El costo del proveedor es requerido',
    })
    .min(0, 'El costo del proveedor no puede ser negativo')
    .refine((val) => !isNaN(val), {
      message: 'El costo del proveedor debe ser un número válido',
    }),
  otherCosts: z.coerce
    .number({
      required_error: 'Otros costos son requeridos',
    })
    .min(0, 'Otros costos no pueden ser negativos')
    .refine((val) => !isNaN(val), {
      message: 'Otros costos deben ser un número válido',
    }),

  stockMin: z.coerce
    .number({
      required_error: 'El stock mínimo es requerido',
    })
    .int('El stock mínimo debe ser un número entero')
    .min(1, 'El stock mínimo debe ser mayor a 0')
    .refine((val) => !isNaN(val), {
      message: 'El stock mínimo debe ser un número válido',
    }),
  stockMax: z.coerce
    .number({
      required_error: 'El stock máximo es requerido',
    })
    .int('El stock máximo debe ser un número entero')
    .min(1, 'El stock máximo debe ser mayor a 0')
    .refine((val) => !isNaN(val), {
      message: 'El stock máximo debe ser un número válido',
    }),
  reorderPoint: z.coerce
    .number({
      required_error: 'El punto de reorden es requerido',
    })
    .int('El punto de reorden debe ser un número entero')
    .min(1, 'El punto de reorden debe ser mayor a 0')
    .refine((val) => !isNaN(val), {
      message: 'El punto de reorden debe ser un número válido',
    }),
  profitSale: z.coerce
    .number({
      required_error: 'La utilidad es requerido',
    })
    .int('La utilidad debe ser un número entero')
    .min(0, 'La utilidad no puede ser negativo')
    .refine((val) => !isNaN(val), {
      message: 'La utilidad debe ser un número válido',
    }),
  profitSupply: z.coerce
    .number({
      required_error: 'La utilidad es requerido',
    })
    .int('La utilidad debe ser un número entero')
    .min(0, 'La utilidad no puede ser negativo')
    .refine((val) => !isNaN(val), {
      message: 'La utilidad debe ser un número válido',
    }),
  totalCost: z.string().optional().nullable(),
  expensePercent: z.string().optional().nullable(),
  profitPercent: z.string().optional().nullable(),
  salesTaxPercent: z.string().optional().nullable(),
  available: z.number().optional().nullable(),
  finalPrice: z.string().optional().nullable(),
});

export type Product = z.infer<typeof productSchema>;
