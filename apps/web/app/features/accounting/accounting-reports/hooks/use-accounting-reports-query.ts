import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingReportsService } from '../services/accounting-reports-service';

export function useJournalBook(params: any) {
  return useQuery({
    queryKey: QUERY_KEYS.accountingReports.journalBook(params),
    queryFn: () => AccountingReportsService.getJournalBook(params),
    enabled: !!params.accountingCycleId,
  });
}

export function useGeneralLedger(params: any) {
  return useQuery({
    queryKey: QUERY_KEYS.accountingReports.generalLedger(params),
    queryFn: () => AccountingReportsService.getGeneralLedger(params),
    enabled: !!params.accountingCycleId,
  });
}

export function useTrialBalance(params: any) {
  return useQuery({
    queryKey: QUERY_KEYS.accountingReports.trialBalance(params),
    queryFn: () => AccountingReportsService.getTrialBalance(params),
    enabled: !!params.accountingCycleId,
  });
}

export function useBalanceSheet(params: any) {
  return useQuery({
    queryKey: QUERY_KEYS.accountingReports.balanceSheet(params),
    queryFn: () => AccountingReportsService.getBalanceSheet(params),
    enabled: !!params.accountingCycleId,
  });
}

export function useIncomeStatement(params: any) {
  return useQuery({
    queryKey: QUERY_KEYS.accountingReports.incomeStatement(params),
    queryFn: () => AccountingReportsService.getIncomeStatement(params),
    enabled: !!params.accountingCycleId,
  });
}
