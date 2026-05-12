import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { settlementService } from '../services/settlement-service';

export function useQuerySettlement(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): UseQueryResult<{ data: unknown[]; meta: unknown }, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.settlements.list(JSON.stringify(params)),
    queryFn: () => settlementService.getSettlements(params || {}),
  });
}

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.settlements.byCedula(cedula),
    queryFn: () => settlementService.getAssociatesByCedula(cedula),
    enabled: options?.enabled ?? !!cedula?.trim(),
    staleTime: 0,
    refetchOnMount: false,
  });
}