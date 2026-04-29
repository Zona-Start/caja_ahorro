'use client';

import { searchParams } from '@/feactures/savings-banks/assets/paymentBatch/utils/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { PAYMENT_BATCH_STATUS } from '../../schemas/payment-batch-options';

export const PAYMENT_BATCH_STATUS_OPTIONS = Object.entries(
  PAYMENT_BATCH_STATUS,
).map(([value, label]) => ({
  value,
  label,
}));

export function usePaymentBatchTableFilters() {
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
