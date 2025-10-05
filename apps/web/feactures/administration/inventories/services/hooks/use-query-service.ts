import { useSafeQuery } from '@/hooks/use-safe-query';
import { getServiceAll, getServices } from '../actions/service-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener servicios con parámetros de paginación/filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useServices(params = {}) {
  return useSafeQuery(
    queryKeys.services.all(params), 
    () => getServices(params)
  );
}

/**
 * Hook para obtener todos los servicios (sin paginación)
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useServicesAll() {
  return useSafeQuery(
    queryKeys.services.listAll(), 
    () => getServiceAll()
  );
}
