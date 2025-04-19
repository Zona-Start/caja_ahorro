import { z } from 'zod';

//schemas Response Query pagiantion
export const associatesSchema = z.object({
  id: z.number(),
  savingsBankId: z.number(),
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
  workerTypeId: z.number().optional(),
  charge: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  createdById: z.number().optional().nullable(),
  updatedById: z.number().optional().nullable(),
});

//schema response query pagination
export const AssociatesResponseSchema = z.object({
  message: z.string(),
  data: z.array(associatesSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPage: z.number().nullable(),
    previousPage: z.number().nullable(),
  }),
});

export const AssociatesByIdSchema = z.object({
  id: z.number(),
  savingsBankId: z.number(),
  cedula: z.string(),
  fullname: z.string(),
  nationality: z.enum(['VENEZOLANO', 'EXTRANJERO']),
  gender: z.enum(['FEMENINO', 'MASCULINO']),
  birthdate: z.string().transform((str) => (str ? new Date(str) : undefined)),
  dateAdmission: z
    .string()
    .transform((str) => (str ? new Date(str) : undefined)),
  dateGraduation: z
    .string()
    .transform((str) => (str ? new Date(str) : undefined))
    .nullable(),
  discountFrequencyId: z.number(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  isPayrollCredit: z.boolean(),
  localityId: z.number(),
  phone: z.string(),
  email: z.string(),
  payrollTypeId: z.number().optional(),
  workerTypeId: z.number().optional(),
  charge: z.string().optional().nullable(),
  balance: z.string(),
  accountNumber: z.string(),
  bankId: z.number(),
  salaryTotal: z.string(),
});

// Response schemas for the API by Create, Update
export const AssociatesMutateResponseSchema = z.object({
  message: z.string(),
  data: associatesSchema,
});

// Response schema for the API query by id
export const AssociatesByIdResponseSchema = z.object({
  message: z.string(),
  data: AssociatesByIdSchema,
});

//schema response delete mutation
export const AssociatesDeleteResponseSchema = z.object({
  message: z.string(),
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

//schema Request for api
export const AssociateMutationSchema = z.object({
  id: z.number().optional(),
  savingsBankId: z.number(),
  cedula: z
    .string()
    .min(7, 'no puede tener menos de 7 digítos')
    .max(8, 'no puede tener más de 8 digítos'),
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
  dateAdmission: z.date(),
  dateGraduation: z.date().optional(),
  discountFrequencyId: z.number(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  isPayrollCredit: z.string(),
  localityId: z.number(),
  phone: z
    .string()
    .min(10, 'El teléfono no puede tener menos de 10 digítos')
    .max(11, 'El teléfono no puede tener más de 11 digítos'),
  email: z.string().email('El correo electrónico no es válido'),
  payrollTypeId: z.number().optional(),
  workerTypeId: z.number().optional(),
  charge: z.string().optional(),
  accountNumber: z.string().min(20).max(20),
  bankId: z.number(),
  salaryTotal: z.string().min(1),
});

export type AssociatesMutate = z.infer<typeof AssociateMutationSchema>;
export type Associates = z.infer<typeof associatesSchema>;
export type AccountsAssociates = z.infer<typeof accountsAssociatesSchema>;
