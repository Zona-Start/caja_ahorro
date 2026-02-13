import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getBalanceSheetAction,
  getGeneralLedgerAction,
  getIncomeStatementAction,
  getJournalBookAction,
  getTrialBalanceAction,
} from '../actions/accounting-reports.actions';

interface JournalBookParams {
  [key: string]: string | number | undefined;
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

export function useJournalBook(params: JournalBookParams) {
  return useSafeQuery(
    queryKeys.accountingReports.journalBook(params),
    () => getJournalBookAction(params),
    {
      enabled: !!params.accountingCycleId,
    },
  );
}

interface GeneralLedgerParams {
  [key: string]: string | number | undefined;
  accountingCycleId: string;
  companyId?: string;
  accountPlanId?: string;
  accountCode?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useGeneralLedger(params: GeneralLedgerParams) {
  return useSafeQuery(
    queryKeys.accountingReports.generalLedger(params),
    () => getGeneralLedgerAction(params),
    {
      enabled: !!params.accountingCycleId,
    },
  );
}

interface TrialBalanceParams {
  [key: string]: string | number | undefined;
  accountingCycleId: string;
  companyId?: string;
  level?: string;
  onlyWithMovements?: string;
}

export function useTrialBalance(params: TrialBalanceParams) {
  return useSafeQuery(
    queryKeys.accountingReports.trialBalance(params),
    () => getTrialBalanceAction(params),
    {
      enabled: !!params.accountingCycleId,
    },
  );
}

interface BalanceSheetParams {
  [key: string]: string | number | undefined;
  accountingCycleId: string;
  companyId?: string;
  detailLevel?: string;
}

export function useBalanceSheet(params: BalanceSheetParams) {
  return useSafeQuery(
    queryKeys.accountingReports.balanceSheet(params),
    () => getBalanceSheetAction(params),
    {
      enabled: !!params.accountingCycleId,
    },
  );
}

interface IncomeStatementParams {
  [key: string]: string | number | undefined;
  accountingCycleId: string;
  companyId?: string;
  detailLevel?: string;
}

export function useIncomeStatement(params: IncomeStatementParams) {
  return useSafeQuery(
    queryKeys.accountingReports.incomeStatement(params),
    () => getIncomeStatementAction(params),
    {
      enabled: !!params.accountingCycleId,
    },
  );
}
