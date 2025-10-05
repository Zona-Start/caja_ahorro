import { useSafeQuery } from '@/hooks/use-safe-query';
import { getPaginatedAccountingEntriesAction } from '../actions/accounting-entry-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener asientos contables paginados
 * @param params - Parámetros de paginación y filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function usePaginatedAccountingEntries(params = {}) {
  return useSafeQuery(
    queryKeys.accountingEntries.paginated(params), 
    () => getPaginatedAccountingEntriesAction(params),
    {
      // Habilitado solo si hay parámetros válidos o está vacío
      enabled: params !== undefined
    }
  );
}
