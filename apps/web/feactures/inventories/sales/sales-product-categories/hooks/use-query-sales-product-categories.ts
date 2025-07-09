import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAllSalesProductCategories,
  getSalesProductCategories,
} from '../actions/sales-product-categories-actions';

export function useSalesProductCategories(params = {}) {
  return useSafeQuery(['sales-product-categories', params], () =>
    getSalesProductCategories(params),
  );
}

export function useSalesProductCategoriesAll() {
  return useSafeQuery(['sales-product-categories-all'], () =>
    getAllSalesProductCategories(),
  );
}
