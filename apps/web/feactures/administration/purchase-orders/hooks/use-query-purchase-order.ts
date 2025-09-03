import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getPurchaseOrdersAction,
  getPurchaseOrderByIdAction,
  getPurchaseOrdersForInvoiceAction,
} from '../actions/purchase-order-actions';

// Hook for associates
export function usePurchaseOrders(params = {}) {
  return useSafeQuery(['purchase-orders', params], () =>
    getPurchaseOrdersAction(params),
  );
}

export function usePurchaseOrdersForInvoice(params: {
  supplierId: number;
  status?: string[];
}) {
  return useSafeQuery(
    ['purchase-orders-for-invoice', params],
    () => getPurchaseOrdersForInvoiceAction(params),
    {
      enabled: !!params.supplierId,
    },
  );
}

export function usePurchaseOrderById(
  id: number,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['purchase-orders-by-id', id],
    () => getPurchaseOrderByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}
