import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getAccountingEntryByIdAction,
  getPaginatedAccountingEntriesAction,
} from '../actions/accounting-entry-actions';

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

/**
 * Hook para obtener un asiento contable por ID
 * @param id - ID del asiento contable
 */
export function useAccountingEntryById(id?: number) {
  return useSafeQuery(
    queryKeys.accountingEntries.detail(id?.toString() || ''),
    () => getAccountingEntryByIdAction(id!),
    { enabled: !!id },
  );
}
