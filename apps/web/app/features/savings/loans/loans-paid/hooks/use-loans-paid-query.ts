import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { loansPaidService } from '../services/loans-paid-service';
import type { LoanPaymentApiResponse } from '../schemas/loans-paid-api-response';
import type { AssociatesLoan } from '../schemas/individual-load-api-schema';

export function useLoansPaidQuery(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    bank?: string;
    type?: string;
    method?: string;
  },
): UseQueryResult<LoanPaymentApiResponse, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.loansPaid.list(params),
    queryFn: () => loansPaidService.getLoansPaid(params),
  });
}

export function useLoanPaidById(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: QUERY_KEYS.loansPaid.detail(id),
    queryFn: () => loansPaidService.getLoanPaidById(id),
    enabled: options?.enabled ?? !!id,
  });
}

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
): UseQueryResult<AssociatesLoan, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.loansPaid.byCedula(cedula),
    queryFn: () => loansPaidService.getAssociatesByCedula(cedula),
    enabled: options?.enabled ?? !!cedula,
  });
}
