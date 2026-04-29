import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getAccountPlansAction,
  getPaginatedAccountPlansAction,
} from '../actions/account-plan-actions';

/**
 * Hook para obtener todas las cuentas contables (sin paginación)
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useAccountingAccounts() {
  return useSafeQuery(queryKeys.accountingAccounts.list(), () =>
    getAccountPlansAction(),
  );
}

/**
 * Hook para obtener cuentas contables paginadas
 * @param params - Parámetros de paginación y filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function usePaginatedAccounts(params = {}) {
  return useSafeQuery(
    queryKeys.accountingAccounts.paginated(params),
    () => getPaginatedAccountPlansAction(params),
    { enabled: Object.keys(params).length > 0 },
  );
}
