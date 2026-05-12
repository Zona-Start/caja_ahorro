import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  group: z.string(),
  description: z.string().nullable().optional(),
});

export const categoryMutationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  group: z.string().min(1, 'El grupo es requerido').max(50),
  description: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryMutation = z.infer<typeof categoryMutationSchema>;
