import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getLoanManagementAllAction,
  getLoanManagementAllCountAction,
  getLoanManagementByIdAction,
} from '../actions/loans-management-actions';

/**
 * Hook para consultar datos de los préstamos con parámetros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useQueryLoanManagement(params = {}) {
  return useSafeQuery(queryKeys.loansManagement.list(params), () =>
    getLoanManagementAllAction(params),
  );
}

/**
 * Hook para obtener un préstamo específico por ID
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useQueryLoanManagementById(
  id: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.loansManagement.detail(id!),
    () => getLoanManagementByIdAction(id!),
    {
      enabled: id != null && (options?.enabled ?? true),
      ...options,
    },
  );
}

/**
 * Hook para obtener el conteo total de préstamos
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useQueryLoanManagementAllCount() {
  return useSafeQuery(
    queryKeys.loansManagement.count(),
    () => getLoanManagementAllCountAction(),
  );
}
