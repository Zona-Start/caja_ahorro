import { z } from 'zod';

// Journal Book (Libro Diario)
export const journalBookDetailSchema = z.object({
  detailId: z.number(),
  accountCode: z.string(),
  accountName: z.string(),
  description: z.string().nullable(),
  debit: z.string(),
  credit: z.string(),
});

export const journalBookEntrySchema = z.object({
  entryId: z.number(),
  entryDate: z.string(),
  description: z.string(),
  originType: z.string().nullable(),
  originReferenceId: z.string().nullable(),
  status: z.string(),
  details: z.array(journalBookDetailSchema),
  totalDebit: z.string(),
  totalCredit: z.string(),
});

export const journalBookResponseSchema = z.object({
  data: z.array(journalBookEntrySchema),
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

export type JournalBookDetail = z.infer<typeof journalBookDetailSchema>;
export type JournalBookEntry = z.infer<typeof journalBookEntrySchema>;
export type JournalBookResponse = z.infer<typeof journalBookResponseSchema>;
