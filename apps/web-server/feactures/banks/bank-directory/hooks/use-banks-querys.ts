'use client';

import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getBanksAction,
  getPaginatedBanksAction,
} from '../actions/banks-actions';

// Hook for all accounts (no pagination)
export function useBanksQuery() {
  return useSafeQuery(queryKeys.bankDirectory.listAll(), () => getBanksAction());
}

// Hook for paginated accounts
export function usePaginatedBanksQuery(params = {}) {
  return useSafeQuery(queryKeys.bankDirectory.list(params), () =>
    getPaginatedBanksAction(params),
  );
}
