import { z } from 'zod';

// RESPONSE API SCHEMA
export const bankAccountApiSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  bankDirectoryId: z.number(),
  bankDirectoryName: z.string().optional(),
  accountNumber: z.string(),
  accountName: z.string().optional().nullable(),
  accountType: z.string(),
  currencyCode: z.string(),
  openingDate: z.string().optional().nullable(),
  currentBalance: z.string().optional().nullable(),
  lastStatementBalance: z.string().optional().nullable(),
  lastStatementDate: z.string().optional().nullable(),
  linkedChartAccountId: z.number(),
  isActive: z.boolean(),
});

//schema response query pagination
export const bankAccountResponseAllSchema = z.object({
  message: z.string(),
  data: z.array(bankAccountApiSchema),
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

// Response schemas for the API by Create, Update, QuerryOne
export const bankAccountResponseOneSchema = z.object({
  message: z.string(),
  data: bankAccountApiSchema,
});

//schema response delete mutation
export const bankAccountDeleteResponseSchema = z.object({
  message: z.string(),
});

export const bankAccountAllApiSchema = z.object({
  id: z.number(),
  bankDirectoryId: z.number(),
  bankDirectoryName: z.string().optional(),
  accountNumber: z.string(),
  accountName: z.string().optional().nullable(),
});

export const bankAccountAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(bankAccountAllApiSchema),
});
