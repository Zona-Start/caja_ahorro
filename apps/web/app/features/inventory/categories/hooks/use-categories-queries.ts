import { CATEGORIES_KEYS } from '../keys/categories-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { categoriesService, type PaginatedResponse } from '../services/categories-service';
import type { Category } from '../schemas/categories.schema';
import type { CategoriesFilters } from './use-categories-filters';

const defaultFilters: CategoriesFilters = {
  page: 1,
  limit: 10,
  search: '',
};

export function useCategoriesQuery(
  filters?: CategoriesFilters,
): UseQueryResult<PaginatedResponse<Category>> {
  return useQuery({
    queryKey: CATEGORIES_KEYS.list(filters ?? defaultFilters),
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
