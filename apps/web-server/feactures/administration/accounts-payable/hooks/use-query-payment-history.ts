import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getAppliedTransactionsAction,
  getPaymentHistoryAction,
} from '../actions/payment-history-actions';

/**
 * Hook para obtener el historial de pagos de una cuenta por pagar
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function usePaymentHistory(id: number, options?: { enabled?: boolean }) {
  return useSafeQuery(
    queryKeys.accountsPayable.paymentHistory(id),
    () => getPaymentHistoryAction(id),
    {
      enabled: !!id && (options?.enabled ?? true),
      ...options,
    },
  );
}

/**
 * Hook para obtener las transacciones aplicadas a una cuenta por pagar
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useAppliedTransactions(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(queryKeys.accountsPayable.appliedTransactions(id), () =>
    getAppliedTransactionsAction(id),
  );
}
