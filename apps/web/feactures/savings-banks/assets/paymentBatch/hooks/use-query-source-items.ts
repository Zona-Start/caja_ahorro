import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getApprovedLiquidationsAction,
  getApprovedLoansAction,
  getApprovedWithdrawalsAction,
} from '../actions/payment-batch-actions';

export function useApprovedLoans() {
  return useSafeQuery(queryKeys.paymentBatchSources.approvedLoans(), () =>
    getApprovedLoansAction(),
  );
}

export function useApprovedWithdrawals() {
  return useSafeQuery(queryKeys.paymentBatchSources.approvedWithdrawals(), () =>
    getApprovedWithdrawalsAction(),
  );
}

export function useApprovedLiquidations() {
  return useSafeQuery(queryKeys.paymentBatchSources.approvedLiquidations(), () =>
    getApprovedLiquidationsAction(),
  );
}
