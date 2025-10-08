import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getPaginatedTypeCreditsAction,
  getTypeCreditsAction,
} from '../actions/type-credits-actions';

// Hook for all type Credits (no pagination)
export function useTypeCredits() {
  return useSafeQuery(queryKeys.typeCredits.allList(), () => getTypeCreditsAction());
}

// Hook for paginated type Credits
export function usePaginatedTypeCredits(params = {}) {
  return useSafeQuery(queryKeys.typeCredits.list(params), () =>
    getPaginatedTypeCreditsAction(params),
  );
}
