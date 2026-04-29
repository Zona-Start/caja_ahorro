import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getLoanPaidAllAction } from '../actions/loans-paid-actions';

/**
 * Hook para obtener la lista de pagos de préstamos con parámetros
 * Utiliza la fábrica centralizada de claves para consultas
 */
export function useQueryLoanPaid(params = {}) {
  return useSafeQuery(
    queryKeys.loansPaid.list(params),
    () => getLoanPaidAllAction(params),
  );
}

// // Hook for a single LoanManagement by ID
// export function useQueryLoanManagementById(
//   id: number | null,
//   options?: { enabled?: boolean },
// ) {
//   return useSafeQuery(
//     ['loan-management-id', id], // Use a query key that includes the ID
//     () => getLoanManagementByIdAction(id!), // Call the new action
//     {
//       enabled: id != null && (options?.enabled ?? true), // Only enabled if id is not null and options allow
//       ...options,
//     },
//   );
// }
