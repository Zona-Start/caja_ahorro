import { CATEGORIES_KEYS } from '../keys/categories-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { categoriesService, type PaginatedResponse } from '../services/categories-service';
import type { Category } from '../schemas/categories.schema';
import type { CategoriesFilters } from './use-categories-filters';

export function useCategoriesQuery(
  filters?: CategoriesFilters,
): UseQueryResult<PaginatedResponse<Category>> {
  return useQuery({
    queryKey: CATEGORIES_KEYS.list(filters ?? {}),
    queryFn: () => categoriesService.getAll(filters),
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

export function useCategoriesByGroupQuery(
  group: string,
  enabled: boolean = true,
): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: CATEGORIES_KEYS.group(group),
    queryFn: () => categoriesService.getByGroup(group),
    enabled: enabled && !!group,
  });
}
