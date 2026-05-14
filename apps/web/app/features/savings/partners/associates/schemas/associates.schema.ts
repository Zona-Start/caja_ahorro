import { z } from 'zod';

//schemas Response Query pagiantion
export const associatesSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  cedula: z.string(),
  fullname: z.string(),
  nationality: z.enum(['VENEZOLANO', 'EXTRANJERO']),
  gender: z.enum(['FEMENINO', 'MASCULINO']),
  birthdate: z.string(),
  dateAdmission: z.string(),
  dateGraduation: z.string().optional().nullable(),
  discountFrequencyId: z.number(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  isPayrollCredit: z.boolean(),
  localityId: z.number(),
  phone: z.string(),
  email: z.string(),
  payrollTypeId: z.number().optional(),
  associatedTypeId: z.number().optional(),
  jobTitle: z.string().nullable().optional(),
  baseSalary: z.string().optional(),
  accountNumber: z.string(),
  currencyCode: z.string().optional(),
  balance: z.string().optional(),
  openingDate: z.string().optional(),
  bankDirectoryId: z.number(),
});

//schema Request for api
export const AssociateMutationSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  cedula: z
    .string()
    .min(7, 'No puede tener menos de 7 digítos')
    .max(8, 'No puede tener más de 8 digítos'),
  fullname: z
    .string()
    .min(1, 'El nombre y apellido es requerido')
    .max(100, 'El nombre y apellido no puede tener más de 100 caracteres'),
  nationality: z.enum(['VENEZOLANO', 'EXTRANJERO'], {
    required_error: 'La nacionalidad es requerido',
    invalid_type_error: 'Tipo de nacionalidad inválida',
  }),
  gender: z.enum(['FEMENINO', 'MASCULINO'], {
    required_error: 'El género es requerido',
    invalid_type_error: 'Tipo de género es inválido',
  }),
  birthdate: z.date({ message: 'Fecha de nacimiento inválida' }),
  dateAdmission: z.date({ message: 'Fecha inválida' }),
  dateGraduation: z.date({ message: 'Fecha inválida' }).optional().nullable(),
  discountFrequencyId: z.string().uuid({
    message: 'La frecuencia de descuento es requerida',
  }),
  status: z.enum([
    'ACTIVE',
    'INACTIVE',
    'PENDING',
    'SUSPENDED',
    'LOCKED',
    'RETIRED',
    'ARCHIVED',
  ]),
  isPayrollCredit: z.boolean(),
  localityId: z.number({ message: 'El Estado es requerido' }).nullable(),
  phone: z
    .string()
    .regex(/^[0-9]+$/, 'El teléfono solo puede contener números')
    .min(10, 'El teléfono no puede tener menos de 10 dígitos')
    .max(11, 'El teléfono no puede tener más de 11 dígitos')
    .nullable(),

  email: z.string().email('El correo electrónico no es válido').nullable(),
  payrollTypeId: z
    .string()
    .uuid({
      message: 'La frecuencia de descuento es requerida',
    })
    .optional(),
  associatedTypeId: z
    .string()
    .uuid({
      message: 'La frecuencia de descuento es requerida',
    })
    .optional(),
  jobTitle: z.string().optional(),
  baseSalary: z
    .string()
    .regex(
      /^[0-9]+(\.[0-9]+)?$/,
      'El sueldo base solo puede contener números y decimales',
    )
    .min(1, 'Sueldo base es requerido'),
  accountNumber: z
    .string()
    .min(20, 'Debe tener 20 dígitos')
    .max(20, 'Debe tener 20 dígitos'),
  currencyCode: z.string().optional(),
  balance: z.string().optional(),
  openingDate: z.string().optional(),
  bankDirectoryId: z.string().uuid({
    message: 'La frecuencia de descuento es requerida',
  }),
});

export const accountsAssociatesSchema = z.object({
  id: z.number().optional(),
  associatedId: z.number().min(1).max(1).optional(),
  balance: z.number().optional(),
  accountNumber: z.string().min(20).max(20),
  bankId: z.number().min(1).max(1),
  salary: z.number().optional(),
  salaryTotal: z.number().min(1),
  openingDate: z.date(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  accountPlanId: z.number().min(1).max(1).optional(),
});

export type AssociatesMutate = z.infer<typeof AssociateMutationSchema>;
export type Associates = z.infer<typeof associatesSchema>;
export type AccountsAssociates = z.infer<typeof accountsAssociatesSchema>;
