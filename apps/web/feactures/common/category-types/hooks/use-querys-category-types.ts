import { useQuery } from '@tanstack/react-query';
import {
  getCategoryTypesAction,
  getPaginatedCategoryTypesAction,
} from '../actions/querys-category-types';

export const CATEGORIES_TYPES_KEY = ['categories-types'];
export const PAGINATED_CATEGORIES_TYPES_KEY = ['paginated_categories_types'];

// Hook for all CategoriesTypes (no pagination)
export function useCategoriesTypes() {
  return useQuery({
    queryKey: CATEGORIES_TYPES_KEY,
    queryFn: getCategoryTypesAction,
  });
}

// Hook for paginated CategoriesTypes
export function usePaginatedCategoriesTypes(params = {}) {
  return useQuery({
    queryKey: [...PAGINATED_CATEGORIES_TYPES_KEY, params],
    queryFn: () => getPaginatedCategoryTypesAction(params),
  });
}
