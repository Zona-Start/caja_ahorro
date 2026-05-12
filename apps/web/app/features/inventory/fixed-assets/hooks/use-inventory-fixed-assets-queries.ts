import { QUERY_KEYS } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { InventoryFixedAssetsFilters } from './use-inventory-fixed-assets-filters';
import { inventoryFixedAssetsService } from '../services/inventory-fixed-assets-service';
import type { InventoryFixedAsset } from '../schemas/inventory-fixed-assets.schema';

export interface Category {
  id: string;
  name: string;
}

export function useInventoryFixedAssetsPaginatedQuery(
  filters: InventoryFixedAssetsFilters,
): UseQueryResult<{ data: InventoryFixedAsset[]; meta: { totalItems: number; itemCount: number; itemsPerPage: number; totalPages: number; currentPage: number } }> {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryFixedAssets.list(filters),
    queryFn: () => inventoryFixedAssetsService.getPaginated(filters),
  });
}

export function useInventoryFixedAssetsAllQuery(): UseQueryResult<
  InventoryFixedAsset[]
> {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryFixedAssets.lists(),
    queryFn: () =>
      inventoryFixedAssetsService.getAll({ page: 1, limit: 100 }),
  });
}

export function useInventoryFixedAssetQuery(
  id: string,
  enabled = true,
): UseQueryResult<InventoryFixedAsset> {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryFixedAssets.detail(id),
    queryFn: () => inventoryFixedAssetsService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useCategoriesQuery(): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/categories');
      if (Array.isArray(response.data)) {
        return response.data as Category[];
      }
      if (response.data?.data) {
        return response.data.data as Category[];
      }
      return [] as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
