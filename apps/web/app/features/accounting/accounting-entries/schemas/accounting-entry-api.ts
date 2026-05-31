import { z } from 'zod';

export const accountingEntryDetailApiSchema = z.object({
  id: z.string().optional(),
  accountPlanId: z.string(),
  debit: z.string(),
  credit: z.string(),
  description: z.string().optional(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  updatedById: z.string().optional().nullable(),
  account: z
    .object({
      code: z.string(),
      name: z.string().optional(),
    })
    .optional(),
});

export const accountingEntryApiSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  accountingCycleId: z.string(),
  entryDate: z.string(),
  description: z.string(),
  voucherNo: z.string().optional().nullable(),
  originReferenceId: z.string().optional().nullable(),
  originType: z.string().optional().nullable(),
  status: z.string().optional(),
  postedAt: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  currencyCode: z.string(),
  createdById: z.string().optional().nullable(),
  updatedById: z.string().optional().nullable(),
  details: z.array(accountingEntryDetailApiSchema),
});

export type AccountingEntryApi = z.infer<typeof accountingEntryApiSchema>;

export const accountingEntryResponseSchema = z.object({
  message: z.string(),
  data: accountingEntryApiSchema,
});

export const accountingEntryDeleteResponseSchema = z.object({
  message: z.string(),
});

export const accountingEntryListResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountingEntryApiSchema),
});

export const accountingEntryPaginationResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountingEntryApiSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});
