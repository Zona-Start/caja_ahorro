import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  group: z.string(),
  description: z.string().nullable().optional(),
  tenantId: z.string().optional(),
});

export const categoryMutationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(255),
  group: z.string().min(1, 'El grupo es requerido').max(50),
  description: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().optional(),
  ),
  tenantId: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().uuid().optional(),
  ),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryMutation = z.infer<typeof categoryMutationSchema>;
