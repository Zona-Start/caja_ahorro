export const inventoryMovementsKeys = {
  all: ['inventory-movements'] as const,
  lists: () => [...inventoryMovementsKeys.all, 'list'] as const,
  list: (filters: object) => [...inventoryMovementsKeys.lists(), filters] as const,
  details: () => [...inventoryMovementsKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryMovementsKeys.details(), id] as const,
};
