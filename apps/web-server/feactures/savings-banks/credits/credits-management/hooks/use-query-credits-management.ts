import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getCreditManagementAllAction,
  getCreditManagementAllCountAction,
  getCreditManagementByIdAction,
} from '../actions/credits-management-actions'; // Import the new action

// // Hook for CreditManagementlist
export function useQueryCreditManagement(params = {}) {
  return useSafeQuery(queryKeys.creditManagements.list(params), () =>
    getCreditManagementAllAction(params),
  );
}

// Hook for a single CreditManagement by ID
export function useQueryCreditManagementById(
  id: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.creditManagements.detail(id!),
    () => getCreditManagementByIdAction(id!),
    {
      enabled: id != null && (options?.enabled ?? true), // Only enabled if id is not null and options allow
      ...options,
    },
  );
}

// Hook for a single CreditManagement by ID
export function useQueryCreditManagementAllCount() {
  return useSafeQuery(queryKeys.creditManagements.count(), () =>
    getCreditManagementAllCountAction(),
  );
}
