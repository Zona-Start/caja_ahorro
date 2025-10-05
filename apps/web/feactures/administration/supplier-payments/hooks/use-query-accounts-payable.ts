import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAccountsPayableAction } from '../actions/accounts-payable-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener cuentas por pagar con parámetros avanzados
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useAccountsPayable(
  params: {
    page?: number;
    limit?: number;
    status?: string[];
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    supplierIds?: number[];
  } = {},
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.accountsPayable.all(params), 
    () => getAccountsPayableAction(params),
    {
      ...options,
    }
  );
}
