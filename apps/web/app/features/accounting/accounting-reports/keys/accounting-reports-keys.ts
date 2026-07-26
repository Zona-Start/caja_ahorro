export const accountingReportsKeys = {
  all: ['accounting-reports'] as const,
  balanceSheet: (filters: Record<string, unknown>) =>
    [...accountingReportsKeys.all, 'balance-sheet', filters] as const,
  incomeStatement: (filters: Record<string, unknown>) =>
    [...accountingReportsKeys.all, 'income-statement', filters] as const,
  trialBalance: (filters: Record<string, unknown>) =>
    [...accountingReportsKeys.all, 'trial-balance', filters] as const,
  journalBook: (filters: Record<string, unknown>) =>
    [...accountingReportsKeys.all, 'journal-book', filters] as const,
  generalLedger: (filters: Record<string, unknown>) =>
    [...accountingReportsKeys.all, 'general-ledger', filters] as const,
  associatesBalance: (filters: Record<string, unknown>) =>
    [...accountingReportsKeys.all, 'associates-balance', filters] as const,
};
