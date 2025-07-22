import { z } from 'zod';

export const CreateInventoryCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  group: z.string().min(1, 'Group is required'),
  description: z.string().optional(),
});

export type CreateInventoryCategoryInput = z.infer<typeof CreateInventoryCategorySchema>;
