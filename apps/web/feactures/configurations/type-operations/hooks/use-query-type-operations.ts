import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getTypeOperationsAllAction,
  getTypeOperationsPaginatedAction,
} from '../actions/type-operations-actions';

// Hook for all accounts (no pagination)
export function useTypeOperations() {
  return useSafeQuery(['type-operations'], () => getTypeOperationsAllAction());
}

// Hook for paginated accounts
export function useTypeOperationsPaginated(params = {}) {
  return useSafeQuery(['paginated-type-operations', params], () =>
    getTypeOperationsPaginatedAction(params),
  );
}
