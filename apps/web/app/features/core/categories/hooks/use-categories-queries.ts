import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { type Category } from '../schemas/categories.schema';
import { categoriesService, type CategoriesPaginatedResponse } from '../services/categories-service';
import { CATEGORIES_KEYS } from '../keys/categories-keys';
import { type CategoriesFilters } from './use-categories-filters';

const mapFiltersToApiParams = (filters: CategoriesFilters) => ({
  page: filters.page,
  limit: filters.limit,
  search: filters.search || undefined,
  type: filters.type || undefined,
  isActive:
    filters.isActive !== undefined
      ? filters.isActive === 'true'
      : undefined,
});

export function useCategoriesQuery(
  filters: CategoriesFilters,
  enabled: boolean = true,
): UseQueryResult<CategoriesPaginatedResponse> {
  return useQuery({
    queryKey: CATEGORIES_KEYS.list(filters),
    queryFn: () => categoriesService.getAll(mapFiltersToApiParams(filters)),
    enabled,
  });
}

export function useCategoriesByTypeQuery(
  type: string,
  enabled: boolean = true,
): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: CATEGORIES_KEYS.byType(type),
    queryFn: () =>
      categoriesService.getAll({ type, limit: 100 }).then((res) => res.data),
    enabled: enabled && !!type,
  });
}

export function useCategoryQuery(
  id: string,
  enabled: boolean = true,
): UseQueryResult<Category> {
  return useQuery({
    queryKey: CATEGORIES_KEYS.detail(id),
    queryFn: () => categoriesService.getById(id),
    enabled: enabled && !!id,
  });
}