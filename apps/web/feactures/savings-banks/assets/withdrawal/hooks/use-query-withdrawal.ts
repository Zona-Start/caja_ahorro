import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getWithdrawalAction,
  getWithdrawalTypeAction,
} from '../actions/withdrawal-actions';

// // Hook for withdrawal list
export function useQueryWithdrawal(params = {}) {
  return useSafeQuery(['withdrawal', params], () =>
    getWithdrawalAction(params),
  );
}

// // Hook for withdrawal list
export function useQueryWithdrawalType() {
  return useSafeQuery(['withdrawal-type'], () => getWithdrawalTypeAction());
}
