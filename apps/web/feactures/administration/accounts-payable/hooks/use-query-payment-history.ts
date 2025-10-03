import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAppliedTransactionsAction,
  getPaymentHistoryAction,
} from '../actions/payment-history-actions';

export function usePaymentHistory(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['payment-history', id],
    () => getPaymentHistoryAction(id),
    {
      enabled: !!id && (options?.enabled ?? true),
      ...options,
    },
  );
}

export function useAppliedTransactions(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['applied-transactions', id],
    () => getAppliedTransactionsAction(id),
    {
      enabled: !!id && (options?.enabled ?? true),
      ...options,
    },
  );
}

