import { z } from 'zod';

export const inventoryCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  group: z.string().min(1, 'El grupo es requerido'),
  description: z.string().optional().nullable(),
});

export type InventoryCategory = z.infer<typeof inventoryCategorySchema>;