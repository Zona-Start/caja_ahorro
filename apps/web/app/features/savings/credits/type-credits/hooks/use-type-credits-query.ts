import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { typeCreditsService } from '../services/type-credits-service';

export function useTypeCreditsQuery(): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.typeCredits.all(),
    queryFn: () => typeCreditsService.getAll(),
  });
}

export function useTypeCreditById(
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.typeCredits.detail(id),
    queryFn: () => typeCreditsService.getById(id),
    enabled: options?.enabled ?? !!id,
  });
}