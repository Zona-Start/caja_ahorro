import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getSupplierAction,
  getSupplierAllAction,
  getSupplierByIdAction,
  getSupplierCountAction,
} from '../actions/suppliers-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener proveedores con parámetros de paginación/filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSuppliers(params = {}) {
  return useSafeQuery(
    queryKeys.suppliers.all(params), 
    () => getSupplierAction(params)
  );
}

/**
 * Hook para obtener un proveedor específico por ID
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierById(id: number, options?: { enabled?: boolean }) {
  return useSafeQuery(
    queryKeys.suppliers.detail(id), 
    () => getSupplierByIdAction(id), 
    {
      enabled: id ? options?.enabled : false,
      ...options,
    }
  );
}

/**
 * Hook para obtener el conteo total de proveedores
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierCount() {
  return useSafeQuery(
    queryKeys.suppliers.count(), 
    () => getSupplierCountAction()
  );
}

/**
 * Hook para obtener todos los proveedores (sin paginación)
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useSupplierAll() {
  return useSafeQuery(
    queryKeys.suppliers.listAll(), 
    () => getSupplierAllAction()
  );
}
