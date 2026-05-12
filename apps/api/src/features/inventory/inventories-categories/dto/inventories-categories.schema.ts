import { z } from 'zod';

export const CreateInventoryCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  group: z.string().min(1, 'El grupo es requerido').max(100),
  description: z.string().optional(),
});

export const UpdateInventoryCategorySchema =
  CreateInventoryCategorySchema.partial();

export type CreateInventoryCategoryDto = z.infer<
  typeof CreateInventoryCategorySchema
>;
export type UpdateInventoryCategoryDto = z.infer<
  typeof UpdateInventoryCategorySchema
>;
