import { z } from 'zod';

// ── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  identifier: z.string().min(1, 'El usuario o correo es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  tenantId: z.string().uuid().optional(),
});

export const permissionSchema = z.object({
  resource: z.string(),
  action: z.string(),
  scope: z.string().optional(),
});

export const membershipSchema = z.object({
  tenantId: z.string().optional(),
  tenantName: z.string().optional(),
  bussinessType: z.string().optional(),
  slug: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  role: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  permissions: z.array(permissionSchema).default([]),
});

export const activeTenantSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  slug: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
});

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullname: z.string(),
  email: z.string().email().or(z.string()),
  status: z.string().optional(),
  isSystemAdmin: z.boolean().optional(),
  activeTenantId: z.string().nullable().optional(),
  activeTenant: activeTenantSchema.nullable().optional(),
  memberships: z.array(membershipSchema).default([]),
  permissions: z.array(permissionSchema).default([]),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});

export const refreshResponseSchema = loginResponseSchema;

// ── Type Exports ─────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
export type User = z.infer<typeof userSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type Membership = z.infer<typeof membershipSchema>;

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
