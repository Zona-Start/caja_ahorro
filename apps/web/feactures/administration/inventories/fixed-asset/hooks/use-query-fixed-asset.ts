import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getFixedAsset,
  getFixedAssetAll,
} from '../actions/fixed-asset-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener activos fijos con parámetros de paginación/filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useFixedAsset(params = {}) {
  return useSafeQuery(
    queryKeys.fixedAssets.all(params), 
    () => getFixedAsset(params)
  );
}

/**
 * Hook para obtener todos los activos fijos (sin paginación)
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useFixedAssetAll() {
  return useSafeQuery(
    queryKeys.fixedAssets.listAll(), 
    () => getFixedAssetAll()
  );
}
