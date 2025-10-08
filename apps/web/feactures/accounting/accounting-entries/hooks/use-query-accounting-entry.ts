import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getPaginatedAccountingEntriesAction } from '../actions/accounting-entry-actions';

/**
 * Hook para obtener asientos contables paginados
 * @param params - Parámetros de paginación y filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function usePaginatedAccountingEntries(params = {}) {
  return useSafeQuery(
    queryKeys.accountingEntries.paginated(params),
    () => getPaginatedAccountingEntriesAction(params),
    { enabled: Object.keys(params).length > 0 },
  );
}
