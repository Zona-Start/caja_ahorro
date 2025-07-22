import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getInventoryMovements,
  getInventoryMovementById,
} from '../actions/inventory-movement-actions';

export function useInventoryMovements(params = {}) {
  return useSafeQuery(['inventory-movements', params], () =>
    getInventoryMovements(params),
  );
}

export function useInventoryMovementById(id: number) {
  return useSafeQuery(['inventory-movement', id], () =>
    getInventoryMovementById(id),
  );
}
