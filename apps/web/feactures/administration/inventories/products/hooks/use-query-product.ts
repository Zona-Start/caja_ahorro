import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getProductAll,
  getProductById,
  getProducts,
} from '../actions/product-actions';

export function useProducts(params = {}) {
  return useSafeQuery(['products', params], () => getProducts(params));
}

export function useProductsAll() {
  return useSafeQuery(['products-all'], () => getProductAll());
}

// Hook for a single LoanManagement by ID
export function useProductById(id: number | null) {
  return useSafeQuery(['product', id], () => getProductById(id!), {
    enabled: !!id,
  });
}
