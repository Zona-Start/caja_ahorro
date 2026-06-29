import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { creditManagementService } from '../services/credits-management-service';
import type {
  SearchAssociateResult,
  AmortizationResult,
  CreditTypeResult,
  BankAccountResult,
} from '../schemas/credits-management-api-response';

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
    queryKey: ['creditManagements', 'list', params],
    queryFn: () => creditManagementService.getCreditManagementAll(params || {}),
  });
}

export function useQueryCreditManagementById(
  id: string,
  options?: { enabled?: boolean },
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: ['creditManagements', 'detail', id],
    queryFn: () => creditManagementService.getCreditManagementById(id),
    enabled: options?.enabled ?? !!id,
  });
}

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: ['creditManagements', 'byCedula', cedula],
    queryFn: () => creditManagementService.getAssociatesByCedula(cedula),
    enabled: options?.enabled ?? !!cedula,
  });
}

export function useSearchAssociate(
  cedula: string,
  options?: { enabled?: boolean },
): UseQueryResult<SearchAssociateResult, Error> {
  return useQuery({
    queryKey: ['creditManagements', 'searchAssociate', cedula],
    queryFn: () => creditManagementService.searchAssociate(cedula),
    enabled: options?.enabled ?? cedula.length >= 7,
  });
}

export function useCalculateAmortization(
  params: {
    amount: number;
    annualRate: number;
    paymentCount: number;
    startDate: string;
    paymentType: string;
    expensesPercentage?: number;
  } | null,
): UseQueryResult<AmortizationResult, Error> {
  return useQuery({
    queryKey: ['creditManagements', 'amortization', params],
    queryFn: () => creditManagementService.calculateAmortization(params!),
    enabled: !!params && params.amount > 0 && params.paymentCount > 0,
  });
}

export function useCreditTypes(): UseQueryResult<CreditTypeResult[], Error> {
  return useQuery({
    queryKey: ['creditManagements', 'creditTypes'],
    queryFn: () => creditManagementService.listCreditTypes(),
  });
}

export function useBankAccounts(): UseQueryResult<BankAccountResult[], Error> {
  return useQuery({
    queryKey: ['creditManagements', 'bankAccounts'],
    queryFn: () => creditManagementService.listBankAccounts(),
  });
}

export function useSuppliers(): UseQueryResult<unknown[], Error> {
  return useQuery({
    queryKey: ['creditManagements', 'suppliers'],
    queryFn: () => creditManagementService.listSuppliers(),
  });
}

export function useProducts(): UseQueryResult<unknown[], Error> {
  return useQuery({
    queryKey: ['creditManagements', 'products'],
    queryFn: () => creditManagementService.listProducts(),
  });
}

export function useQueryCreditManagementCount(): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: ['creditManagements', 'count'],
    queryFn: () => creditManagementService.getCreditManagementAllCount(),
  });
}

export function useCreditDetails(
  id: string,
  options?: { enabled?: boolean },
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: ['creditManagements', 'details', id],
    queryFn: () => creditManagementService.getCreditDetails(id),
    enabled: options?.enabled ?? !!id,
  });
}
