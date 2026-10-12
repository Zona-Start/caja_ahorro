import { z } from 'zod';

/** Login del asociado: usuario = cédula, contraseña = cédula. */
export const loginInputSchema = z.object({
  identifier: z.string().min(1, 'La cédula es requerida').max(20),
  password: z.string().min(1, 'La contraseña es requerida').max(100),
  tenantId: z.string().uuid().optional(),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const tenantBrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string().nullable(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
});
export type TenantBrand = z.infer<typeof tenantBrandSchema>;

export const portalUserSchema = z.object({
  accountId: z.string().uuid(),
  fullname: z.string(),
  cedula: z.string(),
  tenant: tenantBrandSchema.nullable(),
  mustChangePassword: z.boolean(),
});
export type PortalUser = z.infer<typeof portalUserSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: portalUserSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
