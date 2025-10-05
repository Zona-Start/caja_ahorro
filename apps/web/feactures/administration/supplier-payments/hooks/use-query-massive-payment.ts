import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAccountsPayableBySuppliersAction } from '../actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para consultar cuentas por pagar filtradas por proveedores específicos
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useAccountsPayableBySuppliers(
  params: { supplierIds?: number[] } = {},
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.accountsPayable.bySuppliers(params),
    () => getAccountsPayableBySuppliersAction(params),
    {
      // Habilitado solo si hay proveedores seleccionados
      enabled: !!params.supplierIds?.length && (options?.enabled ?? true),
      ...options,
    },
  );
}
