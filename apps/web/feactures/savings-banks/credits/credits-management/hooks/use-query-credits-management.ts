import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getCreditManagementAllAction,
  getCreditManagementAllCountAction,
  getCreditManagementByIdAction,
} from '../actions/credits-management-actions'; // Import the new action

// // Hook for CreditManagementlist
export function useQueryCreditManagement(params = {}) {
  return useSafeQuery(['credit-management', params], () =>
    getCreditManagementAllAction(params),
  );
}

// Hook for a single CreditManagement by ID
export function useQueryCreditManagementById(
  id: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['credit-management-id', id], // Use a query key that includes the ID
    () => getCreditManagementByIdAction(id!), // Call the new action
    {
      enabled: id != null && (options?.enabled ?? true), // Only enabled if id is not null and options allow
      ...options,
    },
  );
}

// Hook for a single CreditManagement by ID
export function useQueryCreditManagementAllCount() {
  return useSafeQuery(
    ['credit-management-count'], // Use a query key that includes the ID
    () => getCreditManagementAllCountAction(), // Call the new action
  );
}
