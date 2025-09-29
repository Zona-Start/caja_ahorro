'use client';

import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { ENTRY_STATUS } from '../../schemas/accounting-entry-options';
import { searchParams } from '../../utils/searchparams';

export const STATUS_OPTIONS = Object.entries(ENTRY_STATUS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function useAccountingEntryTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 500,
      })
      .withDefault(''),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    searchParams.status.withOptions({ shallow: false }).withDefault(''),
  );

  const [cycleFilter, setCycleFilter] = useQueryState(
    'accountingCycleId',
    searchParams.accountingCycleId.withOptions({ shallow: false }),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setCycleFilter(null);
    setPage(1);
  }, [setSearchQuery, setStatusFilter, setCycleFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!statusFilter || !!cycleFilter;
  }, [searchQuery, statusFilter, cycleFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    cycleFilter,
    setCycleFilter,
  };
}
