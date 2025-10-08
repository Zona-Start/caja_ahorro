import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAllInventoryCategories,
  getInventoryCategories,
  getInventoryCategoryById,
} from '../actions/inventory-categories-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener categorías de inventario con parámetros de paginación/filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useInventoryCategories(params = {}) {
  return useSafeQuery(queryKeys.inventoryCategories.list(params), () =>
    getInventoryCategories(params),
  );
}

/**
 * Hook para obtener todas las categorías de inventario por grupo
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useInventoryCategoriesAll(group: string) {
  return useSafeQuery(queryKeys.inventoryCategories.listByGroup(group), () =>
    getAllInventoryCategories(group),
  );
}

/**
 * Hook para obtener una categoría de inventario específica por ID
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useInventoryCategoryById(id: number) {
  return useSafeQuery(queryKeys.inventoryCategories.detail(id), () =>
    getInventoryCategoryById(id),
  );
}
