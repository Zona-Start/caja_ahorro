import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getInventoryMovements, // Keep this for now
} from '../actions/inventory-movement-actions';

export function useInventoryMovements(
  params: {
    // Added type for params
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    itemId?: number; // Changed from productId
    itemType?: string; // Changed from productId
    movementType?: string;
    documentType?: string;
    documentNumber?: string;
  } = {},
) {
  return useSafeQuery(['inventory-movements', params], () =>
    getInventoryMovements(params),
  );
}
