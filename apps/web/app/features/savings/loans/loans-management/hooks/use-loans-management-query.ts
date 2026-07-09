import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { loansManagementKeys } from '../keys/loans-management-keys';
import { loansManagementService } from '../services/loans-management-service';
import type { SearchAssociateResult } from '../schemas/loans-management-api-response';

export function useSearchAssociate(
  cedula: string,
  options?: { enabled?: boolean },
): UseQueryResult<SearchAssociateResult, Error> & { isFetching: boolean } {
  return useQuery({
    queryKey: loansManagementKeys.searchAssociate(cedula),
    queryFn: () => loansManagementService.searchAssociate(cedula),
    enabled: options?.enabled ?? !!cedula,
  }) as any;
}

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
    queryKey: loansManagementKeys.list(params || {}),
    queryFn: () => loansManagementService.getLoansManagementAll(params || {}),
  });
}

export function useQueryLoansManagementById(
  id: string,
  options?: { enabled?: boolean },
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: loansManagementKeys.detail(id),
    queryFn: () => loansManagementService.getLoansManagementById(Number(id)),
    enabled: options?.enabled ?? !!id,
  });
}

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: loansManagementKeys.byCedula(cedula),
    queryFn: () => loansManagementService.getAssociatesByCedula(cedula),
    enabled: options?.enabled ?? !!cedula,
  });
}

export function useQueryLoansManagementCount(): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: loansManagementKeys.count(),
    queryFn: () => loansManagementService.getLoansManagementAllCount(),
  });
}

export function useLoanDetails(
  id: string,
  options?: { enabled?: boolean },
): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: loansManagementKeys.detail(id),
    queryFn: () => loansManagementService.getLoanDetails(id),
    enabled: options?.enabled ?? !!id,
  });
}
