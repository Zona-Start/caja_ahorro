import { useSafeQuery } from '@/hooks/use-safe-query';
import { getProductsAction } from '../actions/products-actions';

export function useProducts(params?: any, options?: any) {
  return useSafeQuery(['products-get-inventory'], () => getProductsAction(), {
    ...options,
  });
}
