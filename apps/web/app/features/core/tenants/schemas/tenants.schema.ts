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

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  rif: z.string(),
  email: z.string().email(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactCedula: z.string().nullable().optional(),
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
  contactEmail: optionalEmailField(
    100,
    'El correo de contacto no es válido',
  ),
  contactCedula: optionalStringField(
    20,
    'La cédula de contacto no puede superar 20 caracteres',
  ),
  isActive: z.boolean().optional(),
});

export type Tenant = z.infer<typeof tenantSchema>;
export type TenantMutation = z.infer<typeof tenantMutationSchema>;
