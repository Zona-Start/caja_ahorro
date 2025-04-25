import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getPaginatedTypeLoansAction,
  getTypeLoansAction,
} from '../actions/type-loans-actions';

// Hook for all type loans (no pagination)
export function useTypeLoans() {
  return useSafeQuery(['type-loans'], () => getTypeLoansAction());
}

// Hook for paginated type loans
export function usePaginatedTypeLoans(params = {}) {
  return useSafeQuery(['paginated-type-loans', params], () =>
    getPaginatedTypeLoansAction(params),
  );
}
