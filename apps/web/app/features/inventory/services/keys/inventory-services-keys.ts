export const inventoryServicesKeys = {
  all: ['inventory-services'] as const,
  lists: () => [...inventoryServicesKeys.all, 'list'] as const,
  list: (filters: object) =>
    [...inventoryServicesKeys.lists(), filters] as const,
  details: () => [...inventoryServicesKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryServicesKeys.details(), id] as const,
};
