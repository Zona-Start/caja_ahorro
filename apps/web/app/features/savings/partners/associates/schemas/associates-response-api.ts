import { z } from 'zod';

// RESPONSE API SCHEMA
export const associateApiSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  cedula: z.string(),
  fullname: z.string(),
  nationality: z.enum(['VENEZOLANO', 'EXTRANJERO']),
  gender: z.enum(['FEMENINO', 'MASCULINO']),
  birthdate: z.string(),
  dateAdmission: z.string(),
  dateGraduation: z.string().optional().nullable(),
  discountFrequencyId: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'RETIRED']),
  isPayrollCredit: z.boolean(),
  localityId: z.number().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  payrollTypeId: z.string().optional(),
  associatedTypeId: z.string().optional(),
  jobTitle: z.string().optional(),
  baseSalary: z.string(),
  associateAccountsId: z.string().optional(),
  accountNumber: z.string(),
  currencyCode: z.string().optional(),
  balance: z.string().optional(),
  openingDate: z.string().optional(),
  bankDirectoryId: z.string(),
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
