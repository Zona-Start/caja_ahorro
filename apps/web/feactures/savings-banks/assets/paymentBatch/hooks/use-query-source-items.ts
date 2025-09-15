import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getApprovedLiquidationsAction,
  getApprovedLoansAction,
  getApprovedWithdrawalsAction,
} from '../actions/payment-batch-actions';

export function useApprovedLoans() {
  return useSafeQuery(['approved-loans'], () => getApprovedLoansAction());
}

export function useApprovedWithdrawals() {
  return useSafeQuery(['approved-withdrawals'], () =>
    getApprovedWithdrawalsAction(),
  );
}

export function useApprovedLiquidations() {
  return useSafeQuery(['approved-liquidations'], () =>
    getApprovedLiquidationsAction(),
  );
}
