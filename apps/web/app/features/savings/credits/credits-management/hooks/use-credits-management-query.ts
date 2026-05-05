import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { creditManagementService } from '../services/credits-management-service';

export function useQueryCreditsManagement(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  modality?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): UseQueryResult<{ data: unknown[]; meta: unknown }, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.creditManagements.list(JSON.stringify(params)),
    queryFn: () => creditManagementService.getCreditManagementAll(params || {}),
  });
}

export function useQueryCreditManagementById(
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.creditManagements.detail(id),
    queryFn: () => creditManagementService.getCreditManagementById(id),
    enabled: options?.enabled ?? !!id,
  });
}

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.creditManagements.byCedula(cedula),
    queryFn: () => creditManagementService.getAssociatesByCedula(cedula),
    enabled: options?.enabled ?? !!cedula,
  });
}

export function useQueryCreditManagementCount(): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.creditManagements.count(),
    queryFn: () => creditManagementService.getCreditManagementAllCount(),
  });
}