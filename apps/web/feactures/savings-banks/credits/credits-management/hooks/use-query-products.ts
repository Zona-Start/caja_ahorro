import { useSafeQuery } from '@/hooks/use-safe-query';
import { getProductsAction } from '../actions/products-actions';

export function useProducts() {
  return useSafeQuery(['products-get-inventory'], () => getProductsAction());
}
