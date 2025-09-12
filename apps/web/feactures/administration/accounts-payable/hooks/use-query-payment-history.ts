import { useSafeQuery } from '@/hooks/use-safe-query';
import { getPaymentsByAccountPayableAction } from '../actions/payment-history-actions';

//hook para consultar detalles de la cuenta por pagar
export function usePaymentsByAccountPayable(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['payment-history', id],
    () => getPaymentsByAccountPayableAction(id),
    {
      enabled: !!id && (options?.enabled ?? true),
      ...options,
    },
  );
}
