import { useSafeQuery } from '@/hooks/use-safe-query';
import { getSupplierPaymentsAction } from '../actions/supplier-payment-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para buscar/consultar los pagos realizados a proveedores
 * Utiliza la fábrica centralizada de claves para consistencia
 */
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
    queryKeys.supplierPayments.all(params),
    () => getSupplierPaymentsAction(params),
    {
      enabled: !!params.status?.length && (options?.enabled ?? true),
      ...options,
    },
  );
}
