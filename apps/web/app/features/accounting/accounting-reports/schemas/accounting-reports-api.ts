import { z } from 'zod';

// Balance Sheet (Balance General)
export const balanceSheetAccountSchema: z.ZodType<any> = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  level: z.number(),
  balance: z.string(),
  children: z
    .array(z.lazy((): z.ZodType<any> => balanceSheetAccountSchema))
    .optional(),
});

export const balanceSheetSectionSchema = z.object({
  title: z.string(),
  accounts: z.array(balanceSheetAccountSchema),
  total: z.string(),
});

export const balanceSheetResponseSchema = z.object({
  assets: balanceSheetSectionSchema,
  liabilities: balanceSheetSectionSchema,
  equity: balanceSheetSectionSchema,
  totals: z.object({
    totalAssets: z.string(),
    totalLiabilities: z.string(),
    totalEquity: z.string(),
    totalLiabilitiesAndEquity: z.string(),
  }),
  cycleInfo: z
    .object({
      cycleId: z.string(),
      description: z.string(),
      endDate: z.string(),
    })
    .nullable(),
});

// General Ledger (Libro Mayor)
export const generalLedgerEntrySchema = z.object({
  entryId: z.string(),
  entryDate: z.string(),
  description: z.string(),
  originType: z.string().nullable(),
  debit: z.string(),
  credit: z.string(),
  balance: z.string(),
});

export const generalLedgerAccountSchema = z.object({
  accountPlanId: z.string(),
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

// Income Statement (Estado de Resultados)
export const incomeStatementAccountSchema: z.ZodType<any> = z.object({
  accountPlanId: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  level: z.number(),
  balance: z.string(),
  children: z
    .array(z.lazy((): z.ZodType<any> => incomeStatementAccountSchema))
    .optional(),
});

export const incomeStatementSectionSchema = z.object({
  title: z.string(),
  accounts: z.array(incomeStatementAccountSchema),
  total: z.string(),
});

export const incomeStatementResponseSchema = z.object({
  revenue: incomeStatementSectionSchema,
  expenses: incomeStatementSectionSchema,
  result: z.object({
    grossProfit: z.string(),
    operatingIncome: z.string(),
    netIncome: z.string(),
  }),
  cycleInfo: z
    .object({
      cycleId: z.string(),
      description: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    })
    .nullable(),
});

// Journal Book (Libro Diario)
export const journalBookDetailSchema = z.object({
  detailId: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  description: z.string().nullable(),
  debit: z.string(),
  credit: z.string(),
});

export const journalBookEntrySchema = z.object({
  entryId: z.string(),
  voucherNo: z.string().optional(),
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

// Trial Balance (Balance de Comprobación)
export const trialBalanceAccountSchema = z.object({
  accountPlanId: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  accountType: z.string(),
  accountNature: z.string(),
  level: z.number(),
  initialBalance: z.string(),
  periodDebit: z.string(),
  periodCredit: z.string(),
  currentBalance: z.string(),
});

export const trialBalanceSummarySchema = z.object({
  totalInitialDebit: z.string(),
  totalInitialCredit: z.string(),
  totalPeriodDebit: z.string(),
  totalPeriodCredit: z.string(),
  totalCurrentDebit: z.string(),
  totalCurrentCredit: z.string(),
});

export const trialBalanceResponseSchema = z.object({
  accounts: z.array(trialBalanceAccountSchema),
  summary: trialBalanceSummarySchema,
  cycleInfo: z
    .object({
      cycleId: z.string(),
      description: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      status: z.string(),
    })
    .nullable(),
});

// Associates Balance (Balance de Asociados)
export const associatesBalanceAccountSchema = z.object({
  accountPlanId: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  accountNature: z.string(),
  totalDebit: z.string(),
  totalCredit: z.string(),
  balance: z.string(),
});

export const associatesBalanceRowSchema = z.object({
  associateId: z.string(),
  cedula: z.string(),
  fullname: z.string(),
  accounts: z.array(associatesBalanceAccountSchema),
  totalBalance: z.string(),
});

export const associatesBalanceResponseSchema = z.object({
  data: z.array(associatesBalanceRowSchema),
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

export type BalanceSheetResponse = z.infer<typeof balanceSheetResponseSchema>;
export type GeneralLedgerResponse = z.infer<typeof generalLedgerResponseSchema>;
export type IncomeStatementResponse = z.infer<typeof incomeStatementResponseSchema>;
export type JournalBookResponse = z.infer<typeof journalBookResponseSchema>;
export type TrialBalanceResponse = z.infer<typeof trialBalanceResponseSchema>;
export type AssociatesBalanceResponse = z.infer<typeof associatesBalanceResponseSchema>;
