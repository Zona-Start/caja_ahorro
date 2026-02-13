export interface JournalBookEntry {
  entryId: number;
  entryDate: string;
  description: string;
  originType: string | null;
  originReferenceId: string | null;
  status: string;
  details: JournalBookDetail[];
  totalDebit: string;
  totalCredit: string;
}

export interface JournalBookDetail {
  detailId: number;
  accountCode: string;
  accountName: string;
  description: string | null;
  debit: string;
  credit: string;
}

export interface JournalBookResponse {
  data: JournalBookEntry[];
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
