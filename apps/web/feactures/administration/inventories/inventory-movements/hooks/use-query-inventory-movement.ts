import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getInventoryMovements,
} from '../actions/inventory-movement-actions';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para obtener movimientos de inventario con parámetros de filtros
 * Utiliza la fábrica centralizada de claves para consistencia
 */
export function useInventoryMovements(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    itemId?: number;
    itemType?: string;
    movementType?: string;
    documentType?: string;
    documentNumber?: string;
  } = {},
) {
  return useSafeQuery(queryKeys.inventoryMovements.list(params), () =>
    getInventoryMovements(params),
  );
}
