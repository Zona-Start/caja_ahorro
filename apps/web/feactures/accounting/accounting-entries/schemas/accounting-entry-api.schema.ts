import { z } from 'zod';

export const accountingEntryDetailSchema = z.object({
  id: z.number().optional(),
  accountPlanId: z.number(),
  debit: z.string(),
  credit: z.string(),
  description: z.string().optional(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  createdById: z.number().optional().nullable(),
  updatedById: z.number().optional().nullable(),
});

export const accountingEntrySchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
  accountingCycleId: z.number(),
  entryDate: z.string(),
  description: z.string(),
  originReferenceId: z.string().optional().nullable(),
  originType: z.string().optional().nullable(),
  status: z.string().optional(),
  currencyCode: z.string(),
  details: z.array(accountingEntryDetailSchema),
});

export type AccountingEntry = z.infer<typeof accountingEntrySchema>;
export type AccountingEntryDetail = z.infer<typeof accountingEntryDetailSchema>;

// API Response Schemas
export const accountingEntryResponseSchema = z.object({
  message: z.string(),
  data: accountingEntrySchema,
});

export const accountingEntryDeleteResponseSchema = z.object({
  message: z.string(),
});

export const accountingEntryListResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountingEntrySchema),
});

export const accountingEntryPaginationResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountingEntrySchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});
