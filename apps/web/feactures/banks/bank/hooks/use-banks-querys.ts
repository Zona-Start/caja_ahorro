'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getBanksAction,
  getPaginatedBanksAction,
} from '../actions/banks-actions';

export const BANKS_KEY = ['accounting_banks'];
export const PAGINATED_BANKS_KEY = ['paginated_banks'];

// Hook for all accounts (no pagination)
export function useBanksQuery() {
  return useQuery({
    queryKey: BANKS_KEY,
    queryFn: getBanksAction,
  });
}

// Hook for paginated accounts
export function usePaginatedBanksQuery(params = {}) {
  return useQuery({
    queryKey: [...PAGINATED_BANKS_KEY, params],
    queryFn: () => getPaginatedBanksAction(params),
  });
}
