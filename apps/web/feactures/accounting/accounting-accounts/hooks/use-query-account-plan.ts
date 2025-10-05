import { useSafeQuery } from "@/hooks/use-safe-query";
import { getAccountPlansAction, getPaginatedAccountPlansAction } from "../actions/account-plan-actions";
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener todas las cuentas contables (sin paginación)
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useAccountingAccounts() {
    return useSafeQuery(
        queryKeys.accountingAccounts.all(), 
        () => getAccountPlansAction()
    )
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
        {
            // Habilitado solo si hay parámetros válidos o está vacío
            enabled: params !== undefined
        }
    )
}
  
