import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getBankAccountAction,
  getBankAccountByIdAction,
} from '../actions/bank-account-actions';

// Hook for associates
export function useBankAccount(params = {}) {
  return useSafeQuery(['bank-account', params], () =>
    getBankAccountAction(params),
  );
}

export function useBankAccountById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['bank-account-by-id', id],
    () => getBankAccountByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}
