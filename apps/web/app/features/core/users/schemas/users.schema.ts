import { z } from 'zod';

const optionalStringField = (max: number, message: string) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().max(max, message).optional(),
  );

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullname: z.string(),
  email: z.string().email(),
  status: z.enum(['active', 'inactive', 'blocked']).optional(),
  isSystemAdmin: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().optional().nullable(),
  tenantMembers: z.array(z.object({
    tenant: z.object({
      id: z.string(),
      name: z.string(),
    }).optional().nullable(),
    role: z.object({
      id: z.string(),
      name: z.string(),
    }).optional().nullable(),
  })).optional().default([]),
});

export const userMutationSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(1, 'El nombre de usuario es requerido').max(50),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  fullname: z.string().min(1, 'El nombre completo es requerido'),
  email: z.string().email('El correo electrónico no es válido'),
  status: z.enum(['active', 'inactive', 'blocked']).default('active'),
  isSystemAdmin: z.boolean().optional().default(false),
  tenantId: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().uuid().optional()
  ),
  roleId: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().uuid().optional()
  ),
  specialPermissionIds: z.array(z.string()).optional().default([]),
});

export type User = z.infer<typeof userSchema>;
export type UserMutation = z.infer<typeof userMutationSchema>;