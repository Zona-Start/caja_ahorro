'use client';

import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { SUPPLIER_PAYMENT_STATUS_TYPES } from '../../schemas';
import { searchParams } from '../../utils';

export const SUPPLIER_PAYMENT_STATUS_OPTIONS = Object.entries(
  SUPPLIER_PAYMENT_STATUS_TYPES,
).map(([value, label]) => ({
  value,
  label,
}));

export function useSupplierPaymentsFilters() {
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
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
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
