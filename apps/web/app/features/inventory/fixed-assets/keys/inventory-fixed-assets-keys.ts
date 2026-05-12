export const inventoryFixedAssetsKeys = {
  all: ['inventory-fixed-assets'] as const,
  lists: () => [...inventoryFixedAssetsKeys.all, 'list'] as const,
  list: (filters: object) =>
    [...inventoryFixedAssetsKeys.lists(), filters] as const,
  details: () => [...inventoryFixedAssetsKeys.all, 'detail'] as const,
  detail: (id: string) =>
    [...inventoryFixedAssetsKeys.details(), id] as const,
};
