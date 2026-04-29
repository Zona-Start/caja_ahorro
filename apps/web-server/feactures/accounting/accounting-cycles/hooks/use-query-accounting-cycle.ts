import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getAccountingCyclesAction,
  getPaginatedAccountingCyclesAction,
} from '../actions/accounting-cycle-actions';

/**
 * Hook para obtener todos los ciclos contables (sin paginación)
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useAccountingCycles() {
  return useSafeQuery(queryKeys.accountingCycles.all(), () =>
    getAccountingCyclesAction(),
  );
}

/**
 * Hook para obtener ciclos contables paginados
 * @param params - Parámetros de paginación y filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function usePaginatedAccountingCycles(params = {}) {
  return useSafeQuery(
    queryKeys.accountingCycles.paginated(params),
    () => getPaginatedAccountingCyclesAction(params),
    { enabled: Object.keys(params).length > 0 },
  );
}
