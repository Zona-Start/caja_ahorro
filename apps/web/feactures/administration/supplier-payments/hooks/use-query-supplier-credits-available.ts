import { useSafeQuery } from '@/hooks/use-safe-query';
import { supplierAvailableCreditAction } from '../actions/supplier-credtis-available';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para consultar los créditos/anticipos disponibles de un proveedor
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierAvailableCredit(
  supplierId: number | undefined,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.accountsPayable.advances(supplierId),
    () => supplierAvailableCreditAction(supplierId as number),
    {
      enabled: !!supplierId && (options?.enabled ?? true),
      ...options,
    },
  );
}
