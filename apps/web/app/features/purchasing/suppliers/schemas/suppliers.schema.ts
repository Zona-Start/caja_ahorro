import { z } from 'zod';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from './suppliers-options';

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

export const supplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  taxId: z.string(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  category: z.string(),
  status: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const supplierMutationSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'El nombre del proveedor es requerido')
    .max(255, 'El nombre no puede superar 255 caracteres'),
  taxId: z
    .string()
    .min(1, 'El identificador fiscal es requerido')
    .max(20, 'El identificador fiscal no puede superar 20 caracteres'),
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
  state: optionalStringField(
    100,
    'La localidad no puede superar 100 caracteres',
  ),
  category: z.enum(
    CATEGORY_OPTIONS.map((c) => c.value) as [string, ...string[]],
    { required_error: 'La categoría es requerida' },
  ),
  status: z.enum(
    STATUS_OPTIONS.map((s) => s.value) as [string, ...string[]],
    { required_error: 'El estado es requerido' },
  ),
});

export type Supplier = z.infer<typeof supplierSchema>;
export type SupplierMutation = z.infer<typeof supplierMutationSchema>;
