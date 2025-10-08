import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getPaginatedTypeLoansAction,
  getTypeLoansAction,
} from '../actions/type-loans-actions';

/**
 * Hook para obtener todos los tipos de préstamos (sin paginación)
 * Utiliza la fábrica centralizada de claves para consultas
 */
export function useTypeLoans() {
  return useSafeQuery(queryKeys.typeLoans.all(), () => getTypeLoansAction());
}

/**
 * Hook para obtener tipos de préstamos paginados
 * Utiliza la fábrica centralizada de claves para consultas
 */
export function usePaginatedTypeLoans(params = {}) {
  return useSafeQuery(queryKeys.typeLoans.paginated(params), () =>
    getPaginatedTypeLoansAction(params),
  );
}
