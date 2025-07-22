import { z } from 'zod';

export const serviceSchema = z.object({
  id: z.number().nullable().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional().nullable(),
  suppliersId: z.number({ required_error: 'El proveedor es requerido' }),
  defaultCost: z.coerce
    .number({
      required_error: 'El costo es requerido',
    })
    .min(0, 'El costo debe ser un número positivo')
    .refine((val) => !isNaN(val), {
      message: 'El costo debe ser un número válido',
    }),
  status: z.string().optional(),
});

export type Service = z.infer<typeof serviceSchema>;
