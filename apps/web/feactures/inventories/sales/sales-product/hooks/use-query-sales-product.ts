import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getSalesProductAll,
  getSalesProducts,
} from '../actions/sales-product-actions';

export function useSalesProducts(params = {}) {
  return useSafeQuery(['sales-products', params], () =>
    getSalesProducts(params),
  );
}

export function useSalesProductsAll() {
  return useSafeQuery(['sales-products-all'], () => getSalesProductAll());
}
