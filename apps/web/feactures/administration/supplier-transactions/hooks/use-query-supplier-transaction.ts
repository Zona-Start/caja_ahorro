import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getSupplierTransactionsAction,
  getSupplierTransactionByIdAction,
} from '../actions/supplier-transaction-actions';

export function useSupplierTransactions(params = {}) {
  return useSafeQuery(['supplier-transactions', params], () =>
    getSupplierTransactionsAction(params),
  );
}

export function useSupplierTransactionById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['supplier-transaction', id],
    () => getSupplierTransactionByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}
