import { z } from 'zod';

export const tenantSettingSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  description: z.string().optional(),
  key: z.string(),
  value: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const tenantSettingMutationSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1, 'La clave es requerida').max(100),
  description: z.string().optional(),
  value: z.string().optional(),
  category: z.string().max(50).default('general'),
});

export type TenantSetting = z.infer<typeof tenantSettingSchema>;
export type TenantSettingMutation = z.infer<typeof tenantSettingMutationSchema>;