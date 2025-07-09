import { z } from 'zod';

export const salesProductCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional().nullable(),
});

export type SalesProductCategory = z.infer<typeof salesProductCategorySchema>;
