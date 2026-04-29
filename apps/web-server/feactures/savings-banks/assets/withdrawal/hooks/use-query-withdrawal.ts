import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getWithdrawalAction,
  getWithdrawalTypeAction,
} from '../actions/withdrawal-actions';

// // Hook for withdrawal list
export function useQueryWithdrawal(params = {}) {
  return useSafeQuery(queryKeys.withdrawals.list(params), () =>
    getWithdrawalAction(params),
  );
}

// // Hook for withdrawal list
export function useQueryWithdrawalType() {
  return useSafeQuery(queryKeys.withdrawalTypes.listAll(), () =>
    getWithdrawalTypeAction(),
  );
}
