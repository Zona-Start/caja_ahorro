import { z } from 'zod';

export const transactionTypeSchema = z.object({
  id: z.number().optional(),
  code: z
    .string()
    .min(1, 'El código es requerido')
    .max(5, 'El código no puede tener más de 5 números')
    .regex(/^[\d]+$/, 'El código debe contener solo números y puntos'),
  description: z.string().min(5, 'La descripción es requerida'),
  deferredDate: z.string().transform((str) => (str ? new Date(str) : null)),
  dateCanceled: z.string().transform((str) => (str ? new Date(str) : null)),
  deferredNumber: z.number().nullable(),
  numberCanceled: z.number().nullable(),
  associatedAccount: z.number().nullable(),
  employerAccount: z.number().nullable(),
  loanAccount: z.number().nullable(),
});

export type TransactionType = z.infer<typeof transactionTypeSchema>;

const transactionTypeApiSchema = z.object({
  id: z.number().optional(),
  code: z.string(),
  description: z.string(),
  deferredDate: z.string().transform((str) => (str ? new Date(str) : null)),
  dateCanceled: z.string().transform((str) => (str ? new Date(str) : null)),
  deferredNumber: z.number().nullable(),
  numberCanceled: z.number().nullable(),
  associatedAccount: z.number().nullable(),
  employerAccount: z.number().nullable(),
  loanAccount: z.number().nullable(),
});

// Response schemas for the API create, update
export const transactionTypeResponseSchema = z.object({
  message: z.string(),
  data: transactionTypeApiSchema,
});

// Response schemas for the API delete
export const transactionTypeDeleteResponseSchema = z.object({
  message: z.string(),
});

// Response schemas for the API all
export const transactionTypeListResponseSchema = z.object({
  message: z.string(),
  data: z.array(transactionTypeSchema),
});

// Response schemas for the API all paginated
// Schema for API response data structure

// Update the paginated response schema to use the API schema
export const transactionTypePaginatedResponse = z.object({
  message: z.string(),
  data: z.array(transactionTypeApiSchema),
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
