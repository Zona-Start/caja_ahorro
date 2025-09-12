import { useSafeQuery } from '@/hooks/use-safe-query';
import { supplierAvailableCreditAction } from '../actions/supplier-credtis-available';

//hook para consultar los creditos disponibles de un proveedor
export function useSupplierAvailableCredit(
  supplierId: number | undefined,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['accounts-payable-advances', supplierId],
    () => supplierAvailableCreditAction(supplierId as number),
    {
      enabled: !!supplierId && (options?.enabled ?? true),
      ...options,
    },
  );
}
