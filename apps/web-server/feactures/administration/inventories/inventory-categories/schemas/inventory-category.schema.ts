import { z } from 'zod';

export const inventoryCategorySchema = z.object({
  id: z.number().optional(),
  name: z
    .string({ message: 'El nombre es requerido' })
    .min(1, 'El nombre es requerido'),
  group: z
    .string({ message: 'El grupo es requerido' })
    .min(1, 'El grupo es requerido'),
  description: z.string().optional().nullable(),
});

export type InventoryCategory = z.infer<typeof inventoryCategorySchema>;
export type CreateInventoryCategoryInput = z.infer<
  typeof inventoryCategorySchema
>;
export const UpdateInventoryCategorySchema = inventoryCategorySchema.partial();
export type UpdateInventoryCategoryInput = z.infer<
  typeof UpdateInventoryCategorySchema
>;
