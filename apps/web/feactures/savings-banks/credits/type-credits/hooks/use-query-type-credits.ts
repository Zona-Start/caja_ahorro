import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getPaginatedTypeCreditsAction,
  getTypeCreditsAction,
} from '../actions/type-credits-actions';

// Hook for all type Credits (no pagination)
export function useTypeCredits() {
  return useSafeQuery(['type-credits'], () => getTypeCreditsAction());
}

// Hook for paginated type Credits
export function usePaginatedTypeCredits(params = {}) {
  return useSafeQuery(['paginated-type-credits', params], () =>
    getPaginatedTypeCreditsAction(params),
  );
}
