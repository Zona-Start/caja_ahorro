import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getTypePayrollAllAction,
  getTypePayrollPaginatedAction,
} from '../actions/type-payroll-actions';

// Hook for all accounts (no pagination)
export function useTypePayroll() {
  return useSafeQuery(queryKeys.typePayroll.all(), () =>
    getTypePayrollAllAction(),
  );
}

// Hook for paginated accounts
export function useTypePayrollPaginated(params = {}) {
  return useSafeQuery(queryKeys.typePayroll.paginated(params), () =>
    getTypePayrollPaginatedAction(params),
  );
}
