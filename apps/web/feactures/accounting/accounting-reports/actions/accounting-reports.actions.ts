'use server';

import { safeFetchApi } from '@/lib/fetch.api';
import {
  BalanceSheetResponse,
  balanceSheetResponseSchema,
} from '../schemas/balance-sheet.schema';
import {
  GeneralLedgerResponse,
  generalLedgerResponseSchema,
} from '../schemas/general-ledger.schema';
import {
  IncomeStatementResponse,
  incomeStatementResponseSchema,
} from '../schemas/income-statement.schema';
import {
  JournalBookResponse,
  journalBookResponseSchema,
} from '../schemas/journal-book.schema';
import {
  TrialBalanceResponse,
  trialBalanceResponseSchema,
} from '../schemas/trial-balance.schema';

interface JournalBookFilters {
  accountingCycleId?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  originType?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const getJournalBookAction = async (
  filters: JournalBookFilters,
): Promise<JournalBookResponse> => {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const [error, data] = await safeFetchApi(
    journalBookResponseSchema,
    `/accounting-reports/journal-book?${queryParams.toString()}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching journal book');
  }

  if (!data) {
    throw new Error('No data returned from API');
  }

  return data;
};

interface GeneralLedgerFilters {
  accountingCycleId: string;
  companyId?: string;
  accountPlanId?: string;
  accountCode?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const getGeneralLedgerAction = async (
  filters: GeneralLedgerFilters,
): Promise<GeneralLedgerResponse> => {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const [error, data] = await safeFetchApi(
    generalLedgerResponseSchema,
    `/accounting-reports/general-ledger?${queryParams.toString()}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching general ledger');
  }

  if (!data) {
    throw new Error('No data returned from API');
  }

  return data;
};

interface TrialBalanceFilters {
  accountingCycleId: string;
  companyId?: string;
  level?: string;
  onlyWithMovements?: string;
}

export const getTrialBalanceAction = async (
  filters: TrialBalanceFilters,
): Promise<TrialBalanceResponse> => {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const [error, data] = await safeFetchApi(
    trialBalanceResponseSchema,
    `/accounting-reports/trial-balance?${queryParams.toString()}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching trial balance');
  }

  if (!data) {
    throw new Error('No data returned from API');
  }

  return data;
};

interface BalanceSheetFilters {
  accountingCycleId: string;
  companyId?: string;
  detailLevel?: string;
}

export const getBalanceSheetAction = async (
  filters: BalanceSheetFilters,
): Promise<BalanceSheetResponse> => {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const [error, data] = await safeFetchApi(
    balanceSheetResponseSchema,
    `/accounting-reports/balance-sheet?${queryParams.toString()}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching balance sheet');
  }

  if (!data) {
    throw new Error('No data returned from API');
  }

  return data;
};

interface IncomeStatementFilters {
  accountingCycleId: string;
  companyId?: string;
  detailLevel?: string;
}

export const getIncomeStatementAction = async (
  filters: IncomeStatementFilters,
): Promise<IncomeStatementResponse> => {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const [error, data] = await safeFetchApi(
    incomeStatementResponseSchema,
    `/accounting-reports/income-statement?${queryParams.toString()}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching income statement');
  }

  if (!data) {
    throw new Error('No data returned from API');
  }

  return data;
};
