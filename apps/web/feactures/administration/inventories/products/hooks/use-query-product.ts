import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getProductAll,
  getProductById,
  getProducts,
} from '../actions/product-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener productos con parámetros de paginación/filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useProducts(params = {}) {
  return useSafeQuery(
    queryKeys.products.all(params), 
    () => getProducts(params)
  );
}

/**
 * Hook para obtener todos los productos (sin paginación)
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useProductsAll() {
  return useSafeQuery(
    queryKeys.products.listAll(), 
    () => getProductAll()
  );
}

/**
 * Hook para obtener un producto específico por ID
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useProductById(id: number | null) {
  return useSafeQuery(
    queryKeys.products.detail(id!), 
    () => getProductById(id!), 
    {
      enabled: !!id,
    }
  );
}
