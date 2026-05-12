import { z } from 'zod';

export const bankAccountApiSchema = z.object({
  id: z.number(),
  bankDirectoryId: z.number(),
  bank: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
  accountName: z.string(),
  accountNumber: z.string(),
  accountType: z.string(),
  currencyCode: z.string(),
  openingDate: z.string(),
  currentBalance: z.number(),
  linkedChartAccountId: z.number().optional().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankAccountApi = z.infer<typeof bankAccountApiSchema>;

export const bankAccountListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(bankAccountApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean().optional().nullable(),
      hasPreviousPage: z.boolean().optional().nullable(),
      nextPage: z.number().optional().nullable(),
      previousPage: z.number().optional().nullable(),
    })
    .optional(),
});

export const bankAccountResponseSchema = z.object({
  message: z.string().optional(),
  data: bankAccountApiSchema,
});
