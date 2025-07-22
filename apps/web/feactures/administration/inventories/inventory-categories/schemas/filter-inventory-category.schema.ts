import { z } from 'zod';
import { PaginationSchema } from '@/schemas';

export const FilterInventoryCategorySchema = PaginationSchema.extend({
  group: z.string().optional(),
});

export type FilterInventoryCategoryInput = z.infer<typeof FilterInventoryCategorySchema>;
