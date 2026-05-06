import { z } from 'zod';

export const moduleSettingSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  module: z.string(),
  submodule: z.string().nullable().optional(),
  key: z.string(),
  value: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const moduleSettingMutationSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().uuid('El tenant es requerido'),
  module: z.string().min(1, 'El módulo es requerido').max(50),
  submodule: z.string().max(50).default(''),
  key: z.string().min(1, 'La clave es requerida').max(100),
  value: z.string().min(1, 'El valor es requerido'),
  description: z.string().optional(),
});

export type ModuleSetting = z.infer<typeof moduleSettingSchema>;
export type ModuleSettingMutation = z.infer<typeof moduleSettingMutationSchema>;