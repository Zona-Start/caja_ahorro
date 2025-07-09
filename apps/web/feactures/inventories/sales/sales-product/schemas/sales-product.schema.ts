import { z } from 'zod';

export const salesProductSchema = z.object({
  id: z.number().nullable().optional(),
  categoryId: z.number({ required_error: 'La categoría es requerida' }),
  productCode: z.string({ required_error: 'El código es requerido' }).min(1),
  name: z.string({ required_error: 'El nombre es requerido' }).min(1),
  description: z.string().optional().nullable(),
  brand: z.string({ required_error: 'La marca es requerido' }).min(1),
  model: z.string({ required_error: 'El modelo es requerido' }).min(1),
  defaultPurchaseCost: z.coerce
    .number({
      required_error: 'El costo de compra es requerido',
    })
    .min(0, 'El costo de compra debe ser un número positivo')
    .refine((val) => !isNaN(val), {
      message: 'El costo de compra debe ser un número válido',
    }),
  defaultSellingPrice: z.coerce
    .number({
      required_error: 'El precio de venta es requerido',
    })
    .min(0, 'El precio de venta debe ser un número positivo')
    .refine((val) => !isNaN(val), {
      message: 'El precio de venta debe ser un número válido',
    }),
  currentStock: z.coerce
    .number({
      required_error: 'El stock actual es requerido',
    })
    .int('El stock actual debe ser un número entero')
    .min(0, 'El stock actual no puede ser negativo')
    .refine((val) => !isNaN(val), {
      message: 'El stock actual debe ser un número válido',
    }),
  minimumStockAlert: z.coerce
    .number({
      required_error: 'El stock mínimo es requerido',
    })
    .int('El stock mínimo debe ser un número entero')
    .min(0, 'El stock mínimo no puede ser negativo')
    .refine((val) => !isNaN(val), {
      message: 'El stock mínimo debe ser un número válido',
    }),
  status: z.string().optional(),
});

export type SalesProduct = z.infer<typeof salesProductSchema>;
