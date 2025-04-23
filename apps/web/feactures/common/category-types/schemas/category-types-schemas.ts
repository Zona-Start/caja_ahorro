import { z } from 'zod';

export const categoryTypesSchema = z.object({
  id: z.number().optional(),
  group: z
    .string()
    .min(1, 'El grupo es requerido')
    .max(30, 'El grupo no puede tener más de 30 caracteres'),
  description: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede tener más de 100 caracteres'),
  options: z.any().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CategoryTypes = z.infer<typeof categoryTypesSchema>;
