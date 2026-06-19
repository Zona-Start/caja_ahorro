import { z } from 'zod';
import { CATEGORY_OPTIONS, STATUS_OPTIONS, VENEZUELAN_STATES } from './suppliers-options';

const optionalStringField = (max: number, message: string) =>
  z.string().max(max, message).optional();

const optionalEmailField = (max: number, message: string) =>
  z.string().email(message).max(max, message).optional();

const statusEnum = z.enum(
  STATUS_OPTIONS.map((s) => s.value) as [string, ...string[]],
);

const statusFromApi = z.string().pipe(statusEnum);

export const supplierSchema = z.object({
  id: z.string(),
  tenantId: z.string().nullable().optional(),
  internalCode: z.string().optional(),
  name: z.string(),
  taxId: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  state: z.number().int().nullable().optional(),
  category: z.string(),
  status: statusFromApi,
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  updatedById: z.string().optional().nullable(),
});

export const supplierMutationSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  internalCode: z.string().optional(),
  name: z
    .string()
    .min(1, 'El nombre del proveedor es requerido')
    .max(255, 'El nombre no puede superar 255 caracteres'),
  taxId: z
    .string()
    .min(1, 'El identificador fiscal es requerido')
    .max(20, 'El identificador fiscal no puede superar 20 caracteres'),
  phone: optionalStringField(
    50,
    'El teléfono no puede superar 50 caracteres',
  ),
  email: optionalEmailField(
    255,
    'El correo no es válido',
  ),
  contactName: optionalStringField(
    255,
    'El nombre de contacto no puede superar 255 caracteres',
  ),
  contactEmail: optionalEmailField(
    100,
    'El correo de contacto no es válido',
  ),
  contactPhone: optionalStringField(
    50,
    'El teléfono de contacto no puede superar 50 caracteres',
  ),
  address: optionalStringField(
    500,
    'La dirección no puede superar 500 caracteres',
  ),
  state: z
    .number()
    .int()
    .positive('Debe seleccionar un estado')
    .optional(),
  category: z
    .string()
    .min(1, 'Debe seleccionar una categoría')
    .refine(
      (v) => CATEGORY_OPTIONS.some((o) => o.value === v),
      'Debe seleccionar una categoría',
    ),
  status: statusEnum.default('ACTIVE').optional(),
});

export type Supplier = z.infer<typeof supplierSchema>;
export type SupplierMutation = z.infer<typeof supplierMutationSchema>;
