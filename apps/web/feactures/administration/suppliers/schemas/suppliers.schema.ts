import { z } from 'zod';

export const supplierSchema = z.object({
  id: z.number().optional(),
  companyId: z.number().optional(),
  code: z
    .string()
    .min(8, { message: 'El código debe tener 8 caracteres (PROVDDDD)' })
    .max(8, { message: 'El código debe tener 8 caracteres (PROVDDDD)' })
    .regex(/^PROV\d{4}$/, { message: 'Formato inválido. Debe ser PROVDDDD (ej: PROV0001)' }),
  name: z
    .string()
    .min(1, { message: 'requerido' })
    .max(255, { message: 'máximo 255 caracteres' }),
  taxId: z
    .string()
    .min(1, { message: 'requerido' })
    .max(12, { message: 'El formato es L-DDDDDDDD-D' })
    .regex(/^[JGCVjgcV]-\d{8}-\d{1}$/, { message: 'Formato inválido. Ej: J-12345678-9' }),
  contactName: z
    .string()
    .max(255, { message: 'máximo 255 caracteres' })
    .optional(),
  contactEmail: z
    .string()
    .email({ message: 'email inválido' })
    .max(255, { message: 'máximo 255 caracteres' })
    .optional(),
  contactPhone: z
    .string()
    .max(50, { message: 'máximo 50 caracteres' })
    .optional(),
  state: z.number().optional(), // Puede ser null en la BD, por eso optional
  address: z.string().optional(),
  category: z.string().min(1, { message: 'requerido' }),
  status: z.string().optional(),
});

export type Supplier = z.infer<typeof supplierSchema>;
