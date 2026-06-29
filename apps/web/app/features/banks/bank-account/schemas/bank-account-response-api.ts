import { z } from 'zod';

export const bankAccountApiSchema = z.object({
  id: z.string().uuid(),
  bankDirectoryId: z.string().uuid(),
  bankDirectoryName: z.string().optional(),
  accountName: z.string().nullable().optional(),
  accountNumber: z.string(),
  accountType: z.string(),
  currencyCode: z.string(),
  openingDate: z.string().nullable().optional(),
  currentBalance: z.number().nullable().optional(),
  lastStatementBalance: z.number().nullable().optional(),
  lastStatementDate: z.string().nullable().optional(),
  linkedChartAccountId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  openingEntryPosted: z.boolean().nullable().optional(),
  ruleAccountId: z.string().uuid().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankAccountApi = z.infer<typeof bankAccountApiSchema>;

export const bankAccountListResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(bankAccountApiSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean().nullable().optional(),
    hasPreviousPage: z.boolean().nullable().optional(),
    nextPage: z.number().nullable().optional(),
    previousPage: z.number().nullable().optional(),
  }),
});

export const bankAccountResponseSchema = z.object({
  message: z.string().optional(),
  data: bankAccountApiSchema,
});

export const balancesByCurrencyApiSchema = z.object({
  currencyCode: z.string(),
  bookBalance: z.number(),
  statementBalance: z.number(),
  difference: z.number(),
});

export const balancesByCurrencyResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(balancesByCurrencyApiSchema),
});

export type BalancesByCurrency = z.infer<typeof balancesByCurrencyApiSchema>;
