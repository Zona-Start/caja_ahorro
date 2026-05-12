export const purchaseOrdersKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrdersKeys.all, 'list'] as const,
  list: (filters: object) => [...purchaseOrdersKeys.lists(), { filters }] as const,
  details: () => [...purchaseOrdersKeys.all, 'detail'] as const,
  detail: (id: number) => [...purchaseOrdersKeys.details(), id] as const,
  forInvoice: (supplierId: number) =>
    [...purchaseOrdersKeys.all, 'for-invoice', supplierId] as const,
};
