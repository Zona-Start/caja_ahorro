import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAccountsPayableBySuppliersAction } from '../actions';

// hook para consultar las cuentas por pagar
export function useAccountsPayableBySuppliers(
  params: { supplierIds?: number[] } = {}, // <-- Cambiado de string a number[]
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['accounts-payable-by-suppliers', params],
    () => getAccountsPayableBySuppliersAction(params),
    {
      // La validación ahora comprueba si el array no está vacío
      enabled: !!params.supplierIds?.length && (options?.enabled ?? true),
      ...options,
    },
  );
}
