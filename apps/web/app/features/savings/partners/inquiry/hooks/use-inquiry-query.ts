import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { inquiryService } from '../services/inquiry-service';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useAssociateDetailsQuery(cedula: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.associate(cedula),
    queryFn: () => inquiryService.getAssociateDetails(cedula),
    enabled: !!cedula,
  });
}

export function useHaberesMovementsQuery(associateId: number, params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.haberes(associateId),
    queryFn: () => inquiryService.getHaberesMovements({ associateId, ...params }),
    enabled: !!associateId,
  });
}

export function useWithdrawalsQuery(associateId: number, params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.withdrawals(associateId),
    queryFn: () => inquiryService.getWithdrawals({ associateId, ...params }),
    enabled: !!associateId,
  });
}

export function useTransactionHistoryQuery(associateId: number, params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.history(associateId),
    queryFn: () => inquiryService.getTransactionHistory({ associateId, ...params }),
    enabled: !!associateId,
  });
}

export function useLoansQuery(associateId: number, params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.loans(associateId),
    queryFn: () => inquiryService.getLoans({ associateId, ...params }),
    enabled: !!associateId,
  });
}

export function useCreditsQuery(associateId: number, params: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.credits(associateId),
    queryFn: () => inquiryService.getCredits({ associateId, ...params }),
    enabled: !!associateId,
  });
}

export function useWithdrawalDetailsQuery(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.inquiry.all, 'withdrawal-detail', id],
    queryFn: () => inquiryService.getWithdrawalDetails(id),
    enabled: !!id,
  });
}

export function useCreditDetailsQuery(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.inquiry.all, 'credit-detail', id],
    queryFn: () => inquiryService.getCreditDetails(id),
    enabled: !!id,
  });
}

export function useLoanDetailsQuery(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.inquiry.all, 'loan-detail', id],
    queryFn: () => inquiryService.getLoanDetails(id),
    enabled: !!id,
  });
}
