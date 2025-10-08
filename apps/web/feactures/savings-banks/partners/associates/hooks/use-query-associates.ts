import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getAssociatesAction,
  getAssociatesByIdAction,
} from '../actions/associates-actions';

// Hook for associates
export function useAssociates(params = {}) {
  return useSafeQuery(queryKeys.associates.list(params), () =>
    getAssociatesAction(params),
  );
}

export function useAssociatesById(id: number, options?: { enabled?: boolean }) {
  return useSafeQuery(
    queryKeys.associates.detail(id),
    () => getAssociatesByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}
