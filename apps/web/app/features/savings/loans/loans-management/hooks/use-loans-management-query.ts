import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { loansManagementService } from '../services/loans-management-service';

export function useQueryLoansManagement(params?: {
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
    queryKey: QUERY_KEYS.loansManagement.list(JSON.stringify(params)),
    queryFn: () => loansManagementService.getLoansManagementAll(params || {}),
  });
}

export function useQueryLoansManagementById(
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.loansManagement.detail(id),
    queryFn: () => loansManagementService.getLoansManagementById(id),
    enabled: options?.enabled ?? !!id,
  });
}

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.loansManagement.byCedula(cedula),
    queryFn: () => loansManagementService.getAssociatesByCedula(cedula),
    enabled: options?.enabled ?? !!cedula,
  });
}

export function useQueryLoansManagementCount(): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.loansManagement.count(),
    queryFn: () => loansManagementService.getLoansManagementAllCount(),
  });
}