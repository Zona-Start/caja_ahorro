'use client';

import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAssociateDetailsAction,
  getCreditsAction,
  getCreditDetailsAction,
  getHaberesMovementsAction,
  getLoanDetailsAction,
  getLoansAction,
  getTransactionHistoryAction,
  getWithdrawalDetailsAction,
  getWithdrawalsAction,
} from '../actions/inquiry-actions';

export function useWithdrawalDetails(
  withdrawalId: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['inquiry', 'withdrawalDetails', withdrawalId],
    () => getWithdrawalDetailsAction(withdrawalId!),
    {
      enabled: !!withdrawalId && (options?.enabled ?? false),
    },
  );
}

export function useCreditDetails(
  creditId: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['inquiry', 'creditDetails', creditId],
    () => getCreditDetailsAction(creditId!),
    {
      enabled: !!creditId && (options?.enabled ?? false),
    },
  );
}

export function useLoanDetails(
  loanId: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['inquiry', 'loanDetails', loanId],
    () => getLoanDetailsAction(loanId!),
    {
      enabled: !!loanId && (options?.enabled ?? false),
    },
  );
}

export function useAssociateDetails(cedula: string | null) {
  return useSafeQuery(
    ['inquiry', 'associateDetails', cedula],
    () => getAssociateDetailsAction(cedula!),
    {
      enabled: !!cedula,
      retry: false,
    },
  );
}

export function useHaberesMovements(
  params: { associateId: number | null; page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    [
      'inquiry',
      'haberesMovements',
      params.associateId,
      params.page,
      params.limit,
    ],
    () =>
      getHaberesMovementsAction({
        associateId: params.associateId!,
        page: params.page,
        limit: params.limit,
      }),
    {
      enabled: !!params.associateId && (options?.enabled ?? false),
    },
  );
}

export function useWithdrawals(
  params: { associateId: number | null; page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['inquiry', 'withdrawals', params.associateId, params.page, params.limit],
    () =>
      getWithdrawalsAction({
        associateId: params.associateId!,
        page: params.page,
        limit: params.limit,
      }),
    {
      enabled: !!params.associateId && (options?.enabled ?? false),
    },
  );
}

export function useTransactionHistory(
  params: { associateId: number | null; page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    [
      'inquiry',
      'transactionHistory',
      params.associateId,
      params.page,
      params.limit,
    ],
    () =>
      getTransactionHistoryAction({
        associateId: params.associateId!,
        page: params.page,
        limit: params.limit,
      }),
    {
      enabled: !!params.associateId && (options?.enabled ?? false),
    },
  );
}

export function useLoans(
  params: { associateId: number | null; page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['inquiry', 'loans', params.associateId, params.page, params.limit],
    () =>
      getLoansAction({
        associateId: params.associateId!,
        page: params.page,
        limit: params.limit,
      }),
    {
      enabled: !!params.associateId && (options?.enabled ?? false),
    },
  );
}

export function useCredits(
  params: { associateId: number | null; page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['inquiry', 'credits', params.associateId, params.page, params.limit],
    () =>
      getCreditsAction({
        associateId: params.associateId!,
        page: params.page,
        limit: params.limit,
      }),
    {
      enabled: !!params.associateId && (options?.enabled ?? false),
    },
  );
}
