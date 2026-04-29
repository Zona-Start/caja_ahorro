import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getApprovedLiquidationsAction,
  getApprovedLoansAction,
  getApprovedWithdrawalsAction,
} from '../actions/loan-disbursement-batch-actions';

export function useApprovedLoans() {
  return useSafeQuery(queryKeys.loanDisbursementBatchSources.approvedLoans(), () =>
    getApprovedLoansAction(),
  );
}

export function useApprovedWithdrawals() {
  return useSafeQuery(queryKeys.loanDisbursementBatchSources.approvedWithdrawals(), () =>
    getApprovedWithdrawalsAction(),
  );
}

export function useApprovedLiquidations() {
  return useSafeQuery(queryKeys.loanDisbursementBatchSources.approvedLiquidations(), () =>
    getApprovedLiquidationsAction(),
  );
}
