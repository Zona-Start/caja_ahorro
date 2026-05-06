import { z } from 'zod';

const optionalStringField = (max: number, message: string) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().max(max, message).optional(),
  );

export const permissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  resource: z.string(),
  action: z.string(),
  scope: z.string().optional(),
  description: z.string().optional(),
});

export const rolePermissionSchema = z.object({
  permission: permissionSchema,
});

export const roleSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isDefault: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  rolePermissions: z.array(rolePermissionSchema).optional().default([]),
  tenant: z.object({
    id: z.string(),
    name: z.string(),
  }).optional().nullable(),
});

export const roleMutationSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().min(1, 'El tenant es requerido').uuid('El tenant debe ser un UUID válido'),
  name: z.string().min(1, 'El nombre es requerido'),
  description: optionalStringField(500, 'La descripción no puede superar 500 caracteres'),
  isDefault: z.boolean().default(false),
  permissionIds: z.array(z.string()).optional().default([]),
});

export type Permission = z.infer<typeof permissionSchema>;
export type RolePermission = z.infer<typeof rolePermissionSchema>;
export type Role = z.infer<typeof roleSchema>;
export type RoleMutation = z.infer<typeof roleMutationSchema>;