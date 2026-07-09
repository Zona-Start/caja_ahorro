import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { inquiryService } from '../services/inquiry-service';
import { QUERY_KEYS } from '@/lib/query-keys';
import type {
  AssociateStatement,
  HaberesMovement,
  WithdrawalListItem,
  LoanListItem,
  CreditListItem,
  TransactionHistory,
} from '../schemas/inquiry-schema';

interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function useStatementQuery(cedula: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.associate(cedula as string),
    queryFn: () => inquiryService.getStatement(cedula as string),
    enabled: !!cedula,
  });
}

export function useHaberesMovementsQuery(
  associateId: string,
  params: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.haberes(associateId),
    queryFn: () => inquiryService.getHaberes(associateId, params),
    enabled: !!associateId,
  });
}

export function useWithdrawalsQuery(
  associateId: string,
  params: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.withdrawals(associateId),
    queryFn: () => inquiryService.getRetiros(associateId, params),
    enabled: !!associateId,
  });
}

export function useTransactionHistoryQuery(
  associateId: string,
  params: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.history(associateId),
    queryFn: () => inquiryService.getHistorial(associateId, params),
    enabled: !!associateId,
  });
}

export function useLoansQuery(
  associateId: string,
  params: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.loans(associateId),
    queryFn: () => inquiryService.getPrestamos(associateId, params),
    enabled: !!associateId,
  });
}

export function useCreditsQuery(
  associateId: string,
  params: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiry.credits(associateId),
    queryFn: () => inquiryService.getCreditos(associateId, params),
    enabled: !!associateId,
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
