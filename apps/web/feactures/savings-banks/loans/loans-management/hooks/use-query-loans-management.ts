import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getLoanManagementAllAction,
  getLoanManagementByIdAction,
} from '../actions/loans-management-actions'; // Import the new action

// // Hook for LoanManagementlist
export function useQueryLoanManagement(params = {}) {
  return useSafeQuery(['loan-management', params], () =>
    getLoanManagementAllAction(params),
  );
}

// Hook for a single LoanManagement by ID
export function useQueryLoanManagementById(
  id: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['loan-management-id', id], // Use a query key that includes the ID
    () => getLoanManagementByIdAction(id!), // Call the new action
    {
      enabled: id != null && (options?.enabled ?? true), // Only enabled if id is not null and options allow
      ...options,
    },
  );
}
