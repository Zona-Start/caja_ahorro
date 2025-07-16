import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getPurchaseOrdersAction,
  getPurchaseOrderByIdAction,
  getPurchaseOrdersCountAction,
} from '../actions/purchase-order-actions';

// Hook for associates
export function usePurchaseOrders(params = {}) {
  return useSafeQuery(['purchase-orders', params], () =>
    getPurchaseOrdersAction(params),
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

export function usePurchaseOrdersCount() {
  return useSafeQuery(['purchase-orders-count'], () =>
    getPurchaseOrdersCountAction(),
  );
}