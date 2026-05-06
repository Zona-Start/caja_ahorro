import { z } from 'zod';

export const permissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  resource: z.string(),
  action: z.string(),
  scope: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  createdAt: z.string().optional(),
  createdById: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export const permissionMutationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  resource: z.string().min(1, 'El recurso es requerido').max(50),
  action: z.string().min(1, 'La acción es requerida').max(20),
  scope: z.string().max(20).default('own'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type Permission = z.infer<typeof permissionSchema>;
export type PermissionMutation = z.infer<typeof permissionMutationSchema>;