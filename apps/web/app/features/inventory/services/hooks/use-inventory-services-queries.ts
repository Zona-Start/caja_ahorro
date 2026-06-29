import { QUERY_KEYS } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { InventoryServicesFilters } from './use-inventory-services-filters';
import { inventoryServicesService } from '../services/inventory-services-service';
import type { InventoryService } from '../schemas/inventory-services.schema';

export interface Category {
  id: string;
  name: string;
}

export function useInventoryServicesPaginatedQuery(
  filters: InventoryServicesFilters,
): UseQueryResult<any> {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryServices.list(filters),
    queryFn: () => inventoryServicesService.getPaginated(filters),
  });
}

export function useInventoryServicesAllQuery(): UseQueryResult<any> {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryServices.lists(),
    queryFn: () =>
      inventoryServicesService.getAll({ page: 1, limit: 100 }),
  });
}

export function useInventoryServiceQuery(
  id: string,
  enabled = true,
): UseQueryResult<any> {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryServices.detail(id),
    queryFn: () => inventoryServicesService.getById(id),
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
