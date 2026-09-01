import { z } from 'zod';

// RESPONSE API SCHEMA
export const associateApiSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  cedula: z.string(),
  fullname: z.string(),
  nationality: z.enum(['VENEZOLANO', 'EXTRANJERO']).nullable(),
  gender: z.enum(['FEMENINO', 'MASCULINO']).nullable(),
  birthdate: z.string().nullable().optional(),
  dateAdmission: z.string().nullable().optional(),
  dateGraduation: z.string().optional().nullable(),
  discountFrequencyId: z.string().uuid().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'RETIRED', 'PENDING', 'LOCKED', 'ARCHIVED']),
  isPayrollCredit: z.boolean(),
  localityId: z.number().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  payrollTypeId: z.string().optional().nullable(),
  associatedTypeId: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  baseSalary: z.string().nullable().optional(),
  associateAccountsId: z.string().optional().nullable(),
  accountNumber: z.string().nullable().optional(),
  currencyCode: z.string().optional().nullable(),
  balance: z.string().optional().nullable(),
  openingDate: z.string().optional().nullable(),
  bankDirectoryId: z.string().optional().nullable(),
});

//schema response query pagination
export const AssociatesResponseAllSchema = z.object({
  message: z.string(),
  data: z.array(associateApiSchema),
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

// Response schemas for the API by Create, Update, QuerryOne
export const AssociatesResponseOneSchema = z.object({
  message: z.string(),
  data: associateApiSchema,
});

//schema response delete mutation
export const AssociatesDeleteResponseSchema = z.object({
  message: z.string(),
});

// Schema para la respuesta de carga masiva
export const AssociatesBulkUploadResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    total: z.number(),
    inserted: z.number(),
    skipped: z.number(),
  }),
});
