'use client';

import { searchParams } from '@/feactures/savings-banks/assets/loanDisbursementBatch/utils/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { LOAN_DISBURSEMENT_BATCH_STATUS } from '../../schemas/loan-disbursement/batch-options';

export const LOAN_DISBURSEMENT_BATCH_STATUS_OPTIONS = Object.entries(
  LOAN_DISBURSEMENT_BATCH_STATUS,
).map(([value, label]) => ({
  value,
  label,
}));

export function useLoanDisbursementBatchTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 1500,
      })
      .withDefault(''),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    searchParams.status.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setPage(1);
  }, [setSearchQuery, setStatusFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!statusFilter;
  }, [searchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
  };
}
