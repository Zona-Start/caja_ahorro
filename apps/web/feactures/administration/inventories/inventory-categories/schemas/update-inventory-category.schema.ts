import { z } from 'zod';
import { CreateInventoryCategorySchema } from './create-inventory-category.schema';

export const UpdateInventoryCategorySchema = CreateInventoryCategorySchema.partial();

export type UpdateInventoryCategoryInput = z.infer<typeof UpdateInventoryCategorySchema>;
