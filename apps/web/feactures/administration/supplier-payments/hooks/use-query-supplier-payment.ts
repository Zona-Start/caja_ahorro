import { useSafeQuery } from '@/hooks/use-safe-query';
import { getSupplierPaymentsAction } from '../actions/supplier-payment-actions';

export function useSupplierPayments(
  params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    supplierIds?: number[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {},
  options?: { enabled?: boolean }
) {
  return useSafeQuery(
    ['supplier-payments', params],
    () => getSupplierPaymentsAction(params),
    {
      enabled: (options?.enabled ?? true),
      ...options,
    }
  );
}