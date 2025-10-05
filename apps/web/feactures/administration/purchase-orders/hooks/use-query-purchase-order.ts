import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getPurchaseOrdersAction,
  getPurchaseOrderByIdAction,
  getPurchaseOrdersForInvoiceAction,
} from '../actions/purchase-order-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener órdenes de compra con parámetros de paginación/filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function usePurchaseOrders(params = {}) {
  return useSafeQuery(
    queryKeys.purchaseOrders.all(params), 
    () => getPurchaseOrdersAction(params)
  );
}

/**
 * Hook para obtener órdenes de compra para facturas de proveedor
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function usePurchaseOrdersForInvoice(params: {
  supplierId: number;
  status?: string[];
}) {
  return useSafeQuery(
    queryKeys.purchaseOrders.forInvoice(params),
    () => getPurchaseOrdersForInvoiceAction(params),
    {
      enabled: !!params.supplierId,
    },
  );
}

/**
 * Hook para obtener una orden de compra específica por ID
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function usePurchaseOrderById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.purchaseOrders.detail(id),
    () => getPurchaseOrderByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}
