import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getAccountPayableByIdAction,
  getAccountsPayableAction,
} from '../actions/account-payable-actions';

/**
 * Hook para consultar datos de las cuentas por pagar con parámetros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useAccountsPayable(params = {}) {
  return useSafeQuery(queryKeys.accountsPayable.list(params), () =>
    getAccountsPayableAction(params),
  );
}

/**
 * Hook para obtener una cuenta por pagar específica por ID
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useAccountPayableById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.accountsPayable.detail(id),
    () => getAccountPayableByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}
