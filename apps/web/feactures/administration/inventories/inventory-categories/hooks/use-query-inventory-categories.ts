import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAllInventoryCategories,
  getInventoryCategories,
  getInventoryCategoryById,
} from '../actions/inventory-categories-actions';

export function useInventoryCategories(params = {}) {
  return useSafeQuery(['inventory-categories', params], () =>
    getInventoryCategories(params),
  );
}

export function useInventoryCategoriesAll(group: string) {
  return useSafeQuery(['inventory-categories-all', group], () =>
    getAllInventoryCategories(group),
  );
}

export function useInventoryCategoryById(id: number) {
  return useSafeQuery(['inventory-category', id], () =>
    getInventoryCategoryById(id),
  );
}
