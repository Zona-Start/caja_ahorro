import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { individualLoadService } from '../services/individual-load-service';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean; retry?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.individualLoad.byCedula(cedula),
    queryFn: () => individualLoadService.getAssociatesByCedula(cedula),
    enabled: options?.enabled ?? !!cedula,
    retry: options?.retry,
    staleTime: 0,
  });
}