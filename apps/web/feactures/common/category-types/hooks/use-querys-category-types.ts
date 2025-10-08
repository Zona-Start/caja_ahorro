'use client';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getCategoryTypesAction,
  getCategoryTypesByGroupAction,
  getPaginatedCategoryTypesAction,
} from '../actions/querys-category-types';

// Hook for all CategoriesTypes (no pagination)
export function useCategoriesTypes() {
  return useSafeQuery(queryKeys.categoryTypes.all(), () =>
    getCategoryTypesAction(),
  );
}

export function useCategoriesTypesGroup(group: string) {
  return useSafeQuery(queryKeys.categoryTypes.group(group), () =>
    getCategoryTypesByGroupAction(group),
  );
}

// Hook for paginated CategoriesTypes
export function usePaginatedCategoriesTypes(params = {}) {
  return useSafeQuery(queryKeys.categoryTypes.paginated(params), () =>
    getPaginatedCategoryTypesAction(params),
  );
}
