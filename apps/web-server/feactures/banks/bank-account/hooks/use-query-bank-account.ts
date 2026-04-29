import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getBankAccountAction,
  getBankAccountAllAction,
  getBankAccountByIdAction,
} from '../actions/bank-account-actions';

// Hook for associates
export function useBankAccount(params = {}) {
  return useSafeQuery(queryKeys.bankAccounts.list(params), () =>
    getBankAccountAction(params),
  );
}

export function useBankAccountById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.bankAccounts.detail(id),
    () => getBankAccountByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}

//hook para traer todas las cuenta de banco de la caja
export function useBankAccountAll() {
  return useSafeQuery(queryKeys.bankAccounts.listAll(), () =>
    getBankAccountAllAction(),
  );
}
