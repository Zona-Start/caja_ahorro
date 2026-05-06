import { z } from 'zod';

export const globalSettingSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const globalSettingMutationSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1, 'La clave es requerida').max(100),
  value: z.string().min(1, 'El valor es requerido'),
  description: z.string().optional(),
  category: z.string().max(50).default('general'),
});

export type GlobalSetting = z.infer<typeof globalSettingSchema>;
export type GlobalSettingMutation = z.infer<typeof globalSettingMutationSchema>;