import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAccountPayableBySupplierAction,
  getInvoicesPayableAction,
  getInvoicesPayableByIdAction,
  getInvoicesPayableCountAction,
} from '../actions/invoices-payable-actions';

// Hook for associates
export function useInvoicesPayable(params = {}) {
  return useSafeQuery(['invoices-payable', params], () =>
    getInvoicesPayableAction(params),
  );
}

export function useInvoicesPayableById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['invoices-payable-by-id', id],
    () => getInvoicesPayableByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}

export function useInvoicesPayableCount() {
  return useSafeQuery(['invoices-payable-count'], () =>
    getInvoicesPayableCountAction(),
  );
}

export function useAccountPayableBySupplier(
  supplierId: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['account-payable-by-supplier'],
    () => getAccountPayableBySupplierAction(supplierId),
    {
      enabled: supplierId ? options?.enabled : false,
      staleTime: 0,
      ...options,
    },
  );
}
