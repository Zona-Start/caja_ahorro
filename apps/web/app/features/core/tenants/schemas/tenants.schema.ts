import { z } from 'zod';

const optionalStringField = (max: number, message: string) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().max(max, message).optional(),
  );

const optionalEmailField = (max: number, message: string) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().email(message).max(max, message).optional(),
  );

const moduleCodeValues = [
  'ACCOUNTING',
  'LOANS',
  'CREDITS',
  'SAVINGS',
  'INVENTORY',
  'PURCHASING',
  'SALES',
  'BANKING',
  'TREASURY',
  'HR_PAYROLL',
  'AUDIT',
] as const;

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  rif: z.string(),
  email: z.string().email(),
  businessType: z
    .enum(['CAJA_AHORRO', 'EMPRESA_COMERCIAL'])
    .default('CAJA_AHORRO'),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactCedula: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  customDomain: z.string().nullable().optional(),
  logoKey: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  faviconKey: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  secondaryColor: z.string().nullable().optional(),
  loginMode: z.enum(['CUSTOM_DOMAIN', 'SUBDOMAIN']).nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedBy: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
});

export const tenantMutationSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'El nombre del tenant es requerido')
    .max(255, 'El nombre no puede superar 255 caracteres'),
  rif: z
    .string()
    .min(1, 'El RIF es requerido')
    .max(20, 'El RIF no puede superar 20 caracteres'),
  email: z
    .string()
    .email('El correo electrónico no es válido')
    .max(100, 'El correo no puede superar 100 caracteres'),
  businessType: z
    .enum(['CAJA_AHORRO', 'EMPRESA_COMERCIAL'])
    .default('CAJA_AHORRO'),
  moduleCodes: z.array(z.enum(moduleCodeValues)).optional(),
  address: optionalStringField(
    500,
    'La dirección no puede superar 500 caracteres',
  ),
  phone: optionalStringField(50, 'El teléfono no puede superar 50 caracteres'),
  contactName: optionalStringField(
    255,
    'El nombre de contacto no puede superar 255 caracteres',
  ),
  contactPhone: optionalStringField(
    50,
    'El teléfono de contacto no puede superar 50 caracteres',
  ),
  contactEmail: optionalEmailField(100, 'El correo de contacto no es válido'),
  contactCedula: optionalStringField(
    20,
    'La cédula de contacto no puede superar 20 caracteres',
  ),
  slug: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z
      .string()
      .max(63, 'El slug no puede superar 63 caracteres')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug inválido (solo minúsculas, números y guiones)',
      )
      .optional(),
  ),
  customDomain: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z
      .string()
      .max(255, 'El dominio no puede superar 255 caracteres')
      .regex(
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
        'Dominio inválido',
      )
      .optional(),
  ),
  logoUrl: optionalStringField(
    500,
    'La URL del logo no puede superar 500 caracteres',
  ),
  logoKey: optionalStringField(
    500,
    'La key del logo no puede superar 500 caracteres',
  ),
  faviconUrl: optionalStringField(
    500,
    'La URL del favicon no puede superar 500 caracteres',
  ),
  faviconKey: optionalStringField(
    500,
    'La key del favicon no puede superar 500 caracteres',
  ),
  primaryColor: optionalStringField(
    9,
    'El color no puede superar 9 caracteres',
  ),
  secondaryColor: optionalStringField(
    9,
    'El color no puede superar 9 caracteres',
  ),
  loginMode: z.enum(['CUSTOM_DOMAIN', 'SUBDOMAIN']).default('SUBDOMAIN'),
  isActive: z.boolean().optional(),
});

export type Tenant = z.infer<typeof tenantSchema>;
export type TenantMutation = z.infer<typeof tenantMutationSchema>;
