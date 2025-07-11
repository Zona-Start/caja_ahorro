import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getSupplierAction,
  getSupplierAllAction,
  getSupplierByIdAction,
  getSupplierCountAction,
} from '../actions/suppliers-actions';

// Hook for associates
export function useSuppliers(params = {}) {
  return useSafeQuery(['supplier', params], () => getSupplierAction(params));
}

export function useSupplierById(id: number, options?: { enabled?: boolean }) {
  return useSafeQuery(['supplier-by-id', id], () => getSupplierByIdAction(id), {
    enabled: id ? options?.enabled : false,
    ...options,
  });
}

export function useSupplierCount() {
  return useSafeQuery(['supplier-count'], () => getSupplierCountAction());
}

export function useSupplierAll() {
  return useSafeQuery(['supplier-all'], () => getSupplierAllAction());
}
