'use client';

import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
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
    queryKeys.inquiry.withdrawalDetails(withdrawalId),
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
    queryKeys.inquiry.creditDetails(creditId),
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
    queryKeys.inquiry.loanDetails(loanId),
    () => getLoanDetailsAction(loanId!),
    {
      enabled: !!loanId && (options?.enabled ?? false),
    },
  );
}

export function useAssociateDetails(cedula: string | null) {
  return useSafeQuery(
    queryKeys.inquiry.associateDetails(cedula),
    () => getAssociateDetailsAction(cedula!),
    {
      enabled: !!cedula,
      retry: false,
    },
  );
}

export function useHaberesMovements(
  associateId: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.inquiry.haberesMovements(associateId),
    () => getHaberesMovementsAction(associateId!),
    {
      enabled: !!associateId && (options?.enabled ?? false),
    },
  );
}

export function useWithdrawals(
  associateId: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.inquiry.withdrawals(associateId),
    () => getWithdrawalsAction(associateId!),
    {
      enabled: !!associateId && (options?.enabled ?? false),
    },
  );
}

export function useTransactionHistory(
  associateId: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.inquiry.transactionHistory(associateId),
    () => getTransactionHistoryAction(associateId!),
    {
      enabled: !!associateId && (options?.enabled ?? false),
    },
  );
}

export function useLoans(
  associateId: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.inquiry.loans(associateId),
    () => getLoansAction(associateId!),
    {
      enabled: !!associateId && (options?.enabled ?? false),
    },
  );
}

export function useCredits(
  associateId: number | null,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.inquiry.credits(associateId),
    () => getCreditsAction(associateId!),
    {
      enabled: !!associateId && (options?.enabled ?? false),
    },
  );
}
