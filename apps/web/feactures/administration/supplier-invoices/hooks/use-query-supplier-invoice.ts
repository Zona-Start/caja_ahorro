import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getInvoicesDraftPendingAction,
  getSupplierInvoiceByIdAction,
  getSupplierInvoicesAction,
} from '../actions/supplier-invoice-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener facturas de proveedor con parámetros de paginación/filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierInvoices(params = {}) {
  return useSafeQuery(
    queryKeys.supplierInvoices.all(params), 
    () => getSupplierInvoicesAction(params)
  );
}

/**
 * Hook para obtener una factura de proveedor específica por ID
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierInvoiceById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.supplierInvoices.detail(id),
    () => getSupplierInvoiceByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}

/**
 * Hook para obtener facturas de proveedor por proveedor específico
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierInvoicesBySupplier(
  supplierId: number | undefined,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.supplierInvoices.bySupplier(supplierId),
    () => getSupplierInvoicesAction({ supplierId, status: 'OPEN' }),
    {
      enabled: supplierId ? options?.enabled : false,
      ...options,
    },
  );
}

/**
 * Hook para obtener facturas de proveedor en borrador/pendientes
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierInvoicesDraftPending(enabled?: boolean) {
  return useSafeQuery(
    queryKeys.supplierInvoices.draftPending(),
    () => getInvoicesDraftPendingAction(),
    {
      enabled: enabled ? true : false,
    },
  );
}
