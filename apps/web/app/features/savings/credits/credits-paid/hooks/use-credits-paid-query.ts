import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { creditsPaidService } from '../services/credits-paid-service';
import type { CreditPaymentApiResponse } from '../schemas/credits-paid-api-response';
import type { AssociatesCredit } from '../schemas/individual-credits-api-schema';

export function useCreditsPaidQuery(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    bank?: string;
    type?: string;
    method?: string;
  },
): UseQueryResult<CreditPaymentApiResponse, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.creditsPaid.list(params),
    queryFn: () => creditsPaidService.getCreditsPaid(params),
  });
}

export function useCreditPaidById(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: QUERY_KEYS.creditsPaid.detail(id),
    queryFn: () => creditsPaidService.getCreditPaidById(id),
    enabled: options?.enabled ?? !!id,
  });
}

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
): UseQueryResult<AssociatesCredit, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.creditsPaid.byCedula(cedula),
    queryFn: () => creditsPaidService.getAssociatesByCedula(cedula),
    enabled: options?.enabled ?? !!cedula,
  });
}
