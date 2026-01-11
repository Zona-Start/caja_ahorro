import { z } from 'zod';

const TypePayrollApiSchema = z.object({
  id: z.number().optional(),
  code: z.string(),
  description: z.string(),
  deferredDate: z.string().nullable(),
  dateCanceled: z.string().nullable(),
  deferredNumber: z.number().nullable(),
  numberCanceled: z.number().nullable(),
  group: z.string(),
  metadata: z.any().nullable(),
  // associatedAccount: z.number().nullable(),
  // employerAccount: z.number().nullable(),
  // loanAccount: z.number().nullable(),
});

// Response schemas for the API create, update
export const typePayrollResponseOneSchema = z.object({
  message: z.string(),
  data: TypePayrollApiSchema,
});

// Response schemas for the API delete
export const typePayrollResponseDeleteSchema = z.object({
  message: z.string(),
});

// Update the paginated response schema to use the API schema
export const typePayrollResponseAllSchema = z.object({
  message: z.string(),
  data: z.array(TypePayrollApiSchema),
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
