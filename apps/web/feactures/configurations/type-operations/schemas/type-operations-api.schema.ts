import { z } from 'zod';

const TypeOperationsApiSchema = z.object({
  id: z.number().optional(),
  code: z.string(),
  description: z.string(),
  deferredDate: z
    .string()
    .transform((str) => (str ? new Date(str) : null))
    .nullable(),
  dateCanceled: z
    .string()
    .transform((str) => (str ? new Date(str) : null))
    .nullable(),
  deferredNumber: z.number().nullable(),
  numberCanceled: z.number().nullable(),
  group: z.string(),
  metadata: z.any().nullable(),
  associatedAccount: z.number().nullable(),
  employerAccount: z.number().nullable(),
  loanAccount: z.number().nullable(),
});

// Response schemas for the API create, update
export const typeOperationsResponseOneSchema = z.object({
  message: z.string(),
  data: TypeOperationsApiSchema,
});

// Response schemas for the API delete
export const typeOperationsResponseDeleteSchema = z.object({
  message: z.string(),
});

// Update the paginated response schema to use the API schema
export const typeOperationsResponseAllSchema = z.object({
  message: z.string(),
  data: z.array(TypeOperationsApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});
