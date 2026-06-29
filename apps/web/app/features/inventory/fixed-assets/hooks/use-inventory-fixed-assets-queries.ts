import { QUERY_KEYS } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { InventoryFixedAssetsFilters } from './use-inventory-fixed-assets-filters';
import { inventoryFixedAssetsService } from '../services/inventory-fixed-assets-service';
import type { InventoryFixedAsset } from '../schemas/inventory-fixed-assets.schema';
import type { InventoryFixedAssetApi } from '../schemas/inventory-fixed-assets-api.schema';

export interface Category {
  id: string;
  name: string;
}

export interface PaginatedMeta {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export function useInventoryFixedAssetsPaginatedQuery(
  filters: InventoryFixedAssetsFilters,
): UseQueryResult<{ data: InventoryFixedAsset[]; meta: PaginatedMeta }> {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryFixedAssets.list(filters),
    queryFn: () => inventoryFixedAssetsService.getPaginated(filters),
  });
}

export function useInventoryFixedAssetsAllQuery(): UseQueryResult<
  InventoryFixedAssetApi[]
> {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryFixedAssets.lists(),
    queryFn: () =>
      inventoryFixedAssetsService.getAll({ page: 1, limit: 100 }) as Promise<InventoryFixedAssetApi[]>,
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

export function useCategoriesByGroupQuery(
  group: string,
): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: ['inventory-categories', group],
    queryFn: async () => {
      const response = await apiClient.get(`/inventory/categories/group/${group}`);
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
