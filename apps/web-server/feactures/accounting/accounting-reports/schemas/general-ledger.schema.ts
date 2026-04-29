import { z } from 'zod';

// General Ledger (Libro Mayor)
export const generalLedgerEntrySchema = z.object({
  entryId: z.number(),
  entryDate: z.string(),
  description: z.string(),
  originType: z.string().nullable(),
  debit: z.string(),
  credit: z.string(),
  balance: z.string(),
});

export const generalLedgerAccountSchema = z.object({
  accountPlanId: z.number(),
  accountCode: z.string(),
  accountName: z.string(),
  accountNature: z.string(),
  initialBalance: z.string(),
  totalDebit: z.string(),
  totalCredit: z.string(),
  finalBalance: z.string(),
  entries: z.array(generalLedgerEntrySchema),
});

export const generalLedgerResponseSchema = z.object({
  data: z.array(generalLedgerAccountSchema),
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

export type GeneralLedgerEntry = z.infer<typeof generalLedgerEntrySchema>;
export type GeneralLedgerAccount = z.infer<typeof generalLedgerAccountSchema>;
export type GeneralLedgerResponse = z.infer<typeof generalLedgerResponseSchema>;
