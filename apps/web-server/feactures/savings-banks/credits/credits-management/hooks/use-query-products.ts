import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getProductsAction } from '../actions/products-actions';

export function useProducts(params?: any, options?: any) {
  return useSafeQuery(queryKeys.creditManagementProducts.listAll(), () =>
    getProductsAction(),
    {
      ...options,
    },
  );
}
