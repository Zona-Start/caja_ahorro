import { z } from 'zod';
import { roleSchema, permissionSchema } from './roles.schema';

export const rolesMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export const rolesListResponseSchema = z.object({
  data: z.array(roleSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export const roleResponseSchema = roleSchema;

export const permissionsListResponseSchema = z.array(permissionSchema);

export const rolePermissionsResponseSchema = z.array(z.object({
  id: z.string(),
  permissionId: z.string(),
  resource: z.string(),
  action: z.string(),
  scope: z.string().optional(),
  description: z.string().optional(),
}));

export const roleDeleteResponseSchema = z.object({
  message: z.string(),
});

export const assignPermissionsResponseSchema = z.union([
  z.object({
    message: z.string(),
  }),
  z.string(),
]);