export const inventoryMovementsKeys = {
  all: ['inventory-movements'] as const,
  lists: () => [...inventoryMovementsKeys.all, 'list'] as const,
  list: (filters: object) => [...inventoryMovementsKeys.lists(), filters] as const,
  details: () => [...inventoryMovementsKeys.all, 'detail'] as const,
  detail: (id: number) => [...inventoryMovementsKeys.details(), id] as const,
  stock: () => [...inventoryMovementsKeys.all, 'stock'] as const,
  stockDetail: (itemType: string, itemId: number) =>
    [...inventoryMovementsKeys.stock(), itemType, itemId] as const,
};
