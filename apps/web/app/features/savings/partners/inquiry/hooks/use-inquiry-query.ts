import { useQuery } from '@tanstack/react-query';
import { inquiryService } from '../services/inquiry-service';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useStatementQuery(cedula: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.associate(cedula as string),
    queryFn: () => inquiryService.getStatement(cedula as string),
    enabled: !!cedula,
  });
}

export function useHaberesMovementsQuery(
  associateId: string,
  params: { page: number; limit: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.haberes(associateId, params),
    queryFn: () => inquiryService.getHaberes(associateId, params),
    enabled: !!associateId,
    placeholderData: (prev) => prev,
  });
}

export function useWithdrawalsQuery(
  associateId: string,
  params: { page: number; limit: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.withdrawals(associateId, params),
    queryFn: () => inquiryService.getRetiros(associateId, params),
    enabled: !!associateId,
    placeholderData: (prev) => prev,
  });
}

export function useTransactionHistoryQuery(
  associateId: string,
  params: { page: number; limit: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.history(associateId, params),
    queryFn: () => inquiryService.getHistorial(associateId, params),
    enabled: !!associateId,
    placeholderData: (prev) => prev,
  });
}

export function useLoansQuery(
  associateId: string,
  params: { page: number; limit: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.loans(associateId, params),
    queryFn: () => inquiryService.getPrestamos(associateId, params),
    enabled: !!associateId,
    placeholderData: (prev) => prev,
  });
}

export function useCreditsQuery(
  associateId: string,
  params: { page: number; limit: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.credits(associateId, params),
    queryFn: () => inquiryService.getCreditos(associateId, params),
    enabled: !!associateId,
    placeholderData: (prev) => prev,
  });
}

export function useWithdrawalDetailsQuery(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.inquiry.all, 'withdrawal-detail', id],
    queryFn: () => inquiryService.getRetiroDetalle(id as string),
    enabled: !!id,
  });
}

export function useCreditDetailsQuery(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.inquiry.all, 'credit-detail', id],
    queryFn: () => inquiryService.getCreditoDetalle(id as string),
    enabled: !!id,
  });
}

export function useLoanDetailsQuery(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.inquiry.all, 'loan-detail', id],
    queryFn: () => inquiryService.getPrestamoDetalle(id as string),
    enabled: !!id,
  });
}
