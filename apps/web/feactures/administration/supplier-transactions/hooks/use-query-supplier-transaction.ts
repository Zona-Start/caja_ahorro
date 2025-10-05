import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getSupplierTransactionsAction,
  getSupplierTransactionByIdAction,
} from '../actions/supplier-transaction-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener transacciones de proveedor con parámetros de paginación/filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierTransactions(params = {}) {
  return useSafeQuery(
    queryKeys.supplierTransactions.all(params), 
    () => getSupplierTransactionsAction(params)
  );
}

/**
 * Hook para obtener una transacción de proveedor específica por ID
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierTransactionById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.supplierTransactions.detail(id),
    () => getSupplierTransactionByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}
