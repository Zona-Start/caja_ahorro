import type { PurchaseOrderFilterParams } from '../services/purchase-orders-api';

export const purchaseOrdersKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrdersKeys.all, 'list'] as const,
  list: (filters: PurchaseOrderFilterParams) => [...purchaseOrdersKeys.lists(), filters] as const,
  details: () => [...purchaseOrdersKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseOrdersKeys.details(), id] as const,
};
