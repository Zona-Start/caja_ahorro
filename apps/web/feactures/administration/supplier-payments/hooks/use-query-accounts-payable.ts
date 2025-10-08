import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getAccountsPayableAction } from '../actions/accounts-payable-actions';

/**
 * Hook para obtener cuentas por pagar y anticipos pentintes con parámetros avanzados
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
    queryKeys.accountsPayable.list(params),
    () => getAccountsPayableAction(params),
    {
      ...options,
    },
  );
}
