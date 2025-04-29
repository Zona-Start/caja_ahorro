import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getTypePayrollAllAction,
  getTypePayrollPaginatedAction,
} from '../actions/type-payroll-actions';

// Hook for all accounts (no pagination)
export function useTypePayroll() {
  return useSafeQuery(['type-payroll'], () => getTypePayrollAllAction());
}

// Hook for paginated accounts
export function useTypePayrollPaginated(params = {}) {
  return useSafeQuery(['paginated-type-payroll', params], () =>
    getTypePayrollPaginatedAction(params),
  );
}
