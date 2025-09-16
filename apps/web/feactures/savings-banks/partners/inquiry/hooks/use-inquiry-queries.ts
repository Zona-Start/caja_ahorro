'use client';

import { useSafeQuery } from '@/hooks/use-safe-query';
import {
  getAssociateDetailsAction,
  getCreditsAction,
  getHaberesMovementsAction,
  getLoansAction,
  getTransactionHistoryAction,
  getWithdrawalsAction,
} from '../actions/inquiry-actions';

export function useAssociateDetails(cedula: string | null) {
  return useSafeQuery(
    ['associate-details', cedula],
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
    ['haberes-movements', associateId],
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
    ['withdrawals', associateId],
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
    ['transaction-history', associateId],
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
  return useSafeQuery([
    'loans', associateId],
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
  return useSafeQuery([
    'credits', associateId],
    () => getCreditsAction(associateId!),
    {
      enabled: !!associateId && (options?.enabled ?? false),
    },
  );
}
