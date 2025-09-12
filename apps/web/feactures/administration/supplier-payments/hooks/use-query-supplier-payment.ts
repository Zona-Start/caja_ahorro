import { useSafeQuery } from '@/hooks/use-safe-query';
import { getSupplierPaymentsAction } from '../actions/supplier-payment-actions';

// hook para buscar los pagos realizados
export function useSupplierPayments(
  params: {
    page?: number;
    limit?: number;
    status?: string[];
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {},
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['payments-by-supplier', params],
    () => getSupplierPaymentsAction(params),
    {
      enabled: !!params.status?.length && (options?.enabled ?? true),
      ...options,
    },
  );
}
