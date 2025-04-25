import { z } from 'zod';

export const typeLoanSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string(),
  interestRateAnnual: z.string(),
  maxLoanAmount: z.string().nullable(),
  minLoanAmount: z.string().nullable(),
  termMonthsMin: z.number(),
  termMonthsMax: z.number(),
});

// Response schemas for the API create, update
export const typeLoanApiResponseSchema = z.object({
  message: z.string(),
  data: typeLoanSchema,
});

// Response schemas for the API delete
export const typeLoanDeleteResponseSchema = z.object({
  message: z.string(),
});

// Response schemas for the API all
export const typeLoanAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(typeLoanSchema),
});

// Update the paginated response schema to use the API schema
export const typeLoanAllPagResponseSchema = z.object({
  message: z.string(),
  data: z.array(typeLoanSchema),
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
