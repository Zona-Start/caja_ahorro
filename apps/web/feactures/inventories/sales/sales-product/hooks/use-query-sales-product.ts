import { useSafeQuery } from '@/hooks/use-safe-query';
import { getSalesProducts } from '../actions/sales-product-actions';

export function useSalesProducts(params = {}) {
  return useSafeQuery(['sales-products', params], () =>
    getSalesProducts(params),
  );
}