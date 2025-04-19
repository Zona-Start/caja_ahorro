'use client';
import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getCategoryTypesAction,
  getCategoryTypesByGroupAction,
  getPaginatedCategoryTypesAction,
} from '../actions/querys-category-types';

export const CATEGORIES_TYPES_KEY = ['categories-types'];
export const PAGINATED_CATEGORIES_TYPES_KEY = ['paginated_categories_types'];

// Hook for all CategoriesTypes (no pagination)
export function useCategoriesTypes() {
  return useSafeQuery(['categories-types'], () => getCategoryTypesAction());
}

export function useCategoriesTypesGroup(group: string) {
  return useSafeQuery(['categories-types', group], () =>
    getCategoryTypesByGroupAction(group),
  );
}

// Hook for paginated CategoriesTypes
export function usePaginatedCategoriesTypes(params = {}) {
  return useSafeQuery(['paginated_categories_types', params], () =>
    getPaginatedCategoryTypesAction(params),
  );
}
