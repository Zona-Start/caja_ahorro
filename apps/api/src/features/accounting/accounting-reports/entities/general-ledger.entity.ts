export interface GeneralLedgerEntry {
  entryId: number;
  entryDate: string;
  description: string;
  originType: string | null;
  debit: string;
  credit: string;
  balance: string;
}

export interface GeneralLedgerAccount {
  accountPlanId: number;
  accountCode: string;
  accountName: string;
  accountNature: string;
  initialBalance: string;
  totalDebit: string;
  totalCredit: string;
  finalBalance: string;
  entries: GeneralLedgerEntry[];
}

export interface GeneralLedgerResponse {
  data: GeneralLedgerAccount[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}
