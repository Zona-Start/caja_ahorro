'use client';

import {
  getBanksAction,
  getPaginatedBanksAction,
} from '../actions/banks-actions';
import { useSafeQuery } from '@/hooks/use-safe-query';


// Hook for all accounts (no pagination)
export function useBanksQuery() {
  return useSafeQuery(['accounting_banks'], ()=> getBanksAction())
}

// Hook for paginated accounts
export function usePaginatedBanksQuery(params = {}) {
  return useSafeQuery(['paginated_banks', params], ()=> getPaginatedBanksAction(params))
}
