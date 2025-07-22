import { z } from 'zod';

export const productSchema = z.object({
  id: z.number().nullable().optional(),
  categoryId: z.number({ required_error: 'La categoría es requerida' }),
  sku: z.string().optional().nullable(),
  name: z.string({ required_error: 'El nombre es requerido' }).min(1),
  description: z.string().optional().nullable(),
  brand: z.string({ required_error: 'La marca es requerida' }).min(1),
  model: z.string({ required_error: 'El modelo es requerido' }).min(1),
  stockMin: z.coerce
    .number({
      required_error: 'El stock mínimo es requerido',
    })
    .int('El stock mínimo debe ser un número entero')
    .min(0, 'El stock mínimo no puede ser negativo')
    .refine((val) => !isNaN(val), {
      message: 'El stock mínimo debe ser un número válido',
    }),
  stockMax: z.coerce
    .number({
      required_error: 'El stock máximo es requerido',
    })
    .int('El stock máximo debe ser un número entero')
    .min(0, 'El stock máximo no puede ser negativo')
    .refine((val) => !isNaN(val), {
      message: 'El stock máximo debe ser un número válido',
    }),
  reorderPoint: z.coerce
    .number({
      required_error: 'El punto de reorden es requerido',
    })
    .int('El punto de reorden debe ser un número entero')
    .min(0, 'El punto de reorden no puede ser negativo')
    .refine((val) => !isNaN(val), {
      message: 'El punto de reorden debe ser un número válido',
    }),
  status: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;
