import { apiClient } from '@/lib/api-client';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '../schemas/products.schema';
import type {
  PaginatedProductsResponse,
  ProductQueryParams,
} from '../services/products-service';
import { ProductsService } from '../services/products-service';

export function useProductsQuery(params: ProductQueryParams) {
  return useQuery<PaginatedProductsResponse>({
    queryKey: QUERY_KEYS.products.list(params),
    queryFn: () => ProductsService.getPaginated(params),
  });
}

export function useProductQuery(id: string) {
  return useQuery<Product>({
    queryKey: QUERY_KEYS.products.detail(id),
    queryFn: () => ProductsService.getById(id),
    enabled: !!id,
  });
}

export function useCategoriesQuery() {
  return useQuery<{ id: string; name: string }[]>({
    queryKey: [...QUERY_KEYS.products.all, 'categories'] as const,
    queryFn: async () => {
      const response = await apiClient.get('/inventory/categories');
      return response.data?.data ?? response.data ?? [];
    },
  });
}

export function useProductDefaults() {
  return useQuery({
    queryKey: [...QUERY_KEYS.products.all, 'defaults'] as const,
    queryFn: () => ProductsService.getDefaults(),
    staleTime: 5 * 60 * 1000,
  });
}
