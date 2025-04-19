import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAssociatesAction,
  getAssociatesByIdAction,
} from '../actions/associates-actions';

// Hook for associates
export function useAssociates(params = {}) {
  return useSafeQuery(['associates', params], () =>
    getAssociatesAction(params),
  );
}

export function useAssociatesById(id: number, options?: { enabled?: boolean }) {
  return useSafeQuery(
    ['associates-by-id', id],
    () => getAssociatesByIdAction(id),
    {
      enabled: id ? options?.enabled : false,
      ...options,
    },
  );
}
