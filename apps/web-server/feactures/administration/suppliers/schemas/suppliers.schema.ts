import { z } from 'zod';

export const supplierSchema = z.object({
  id: z.number().optional(),
  companyId: z.number().optional(),
  code: z.string().optional().nullable(),
  name: z
    .string()
    .min(1, { message: 'requerido' })
    .max(255, { message: 'máximo 255 caracteres' }),
  taxId: z
    .string()
    .min(1, { message: 'requerido' })
    .max(12, { message: 'El formato es L-DDDDDDDD-D' })
    .regex(/^[JGCVjgcV]-\d{8}-\d{1}$/, {
      message: 'Formato inválido. Ej: J-12345678-9',
    }),
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
    .regex(/^[0-9]+$/, 'El teléfono solo puede contener números')
    .min(10, 'El teléfono no puede tener menos de 10 dígitos')
    .max(11, 'El teléfono no puede tener más de 11 dígitos')
    .optional(),
  state: z.number().optional(), // Puede ser null en la BD, por eso optional
  address: z.string().optional(),
  category: z.string().min(1, { message: 'requerido' }),
  status: z.string().optional(),
});

export type Supplier = z.infer<typeof supplierSchema>;
