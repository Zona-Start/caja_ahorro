import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getCreditPaidAllAction } from '../actions/credits-paid-actions';

// // Hook for CreditManagementlist
export function useQueryCreditPaid(params = {}) {
  return useSafeQuery(queryKeys.creditsPaid.list(params), () =>
    getCreditPaidAllAction(params),
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
