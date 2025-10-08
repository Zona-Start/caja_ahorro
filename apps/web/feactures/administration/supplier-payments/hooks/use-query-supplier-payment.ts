import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getOneAccountsPayableAction } from '../actions/accounts-payable-actions';
import { getSupplierPaymentsAction } from '../actions/supplier-payment-actions';

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
    queryKeys.supplierPayments.list(params),
    () => getSupplierPaymentsAction(params),
    {
      enabled: !!params.status?.length && (options?.enabled ?? true),
      ...options,
    },
  );
}

export function useOneSupplierPayments(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.supplierPayments.detail(id),
    () => getOneAccountsPayableAction(id),
    {
      enabled: options?.enabled ?? false,
      ...options,
    },
  );
}
