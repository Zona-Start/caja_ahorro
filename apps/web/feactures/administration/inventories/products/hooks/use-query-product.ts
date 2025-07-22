import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getProductAll,
  getProducts,
  getInventoryCategoryById,
} from '../actions/product-actions';

export function useProducts(params = {}) {
  return useSafeQuery(['products', params], () => getProducts(params));
}

export function useProductsAll() {
  return useSafeQuery(['products-all'], () => getProductAll());
}

export function useProductById(id: number) {
  return useSafeQuery(['product', id], () => getInventoryCategoryById(id));
}
