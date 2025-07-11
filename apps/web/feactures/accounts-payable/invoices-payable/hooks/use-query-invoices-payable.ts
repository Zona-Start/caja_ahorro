import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getInvoicesPayableAction,
  getInvoicesPayableByIdAction,
  getInvoicesPayableCountAction,
} from '../actions/invoices-payable-actions';

// Hook for associates
export function useInvoicesPayable(params = {}) {
  return useSafeQuery(['invoices-payable', params], () => getInvoicesPayableAction(params));
}

export function useInvoicesPayableById(id: number, options?: { enabled?: boolean }) {
  return useSafeQuery(['invoices-payable-by-id', id], () => getInvoicesPayableByIdAction(id), {
    enabled: id ? options?.enabled : false,
    ...options,
  });
}

export function useInvoicesPayableCount() {
  return useSafeQuery(['invoices-payable-count'], () => getInvoicesPayableCountAction());
}
