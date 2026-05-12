import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import { getStatesAction } from '../services/querys-states';

// Hook for all States
export function useStatesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.states.list({}),
    queryFn: () => getStatesAction(),
  });
}
