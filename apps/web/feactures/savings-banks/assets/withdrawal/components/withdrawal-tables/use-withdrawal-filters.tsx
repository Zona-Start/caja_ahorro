'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { ESTATUS_TYPES, PAYMENT_METHOD } from '../../schemas/withdrawal-options';

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const ESTATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function useWithdrawalTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 1500, // Add 500ms delay
        // Removed dedupingInterval as it's not a valid option
      })
      .withDefault(''),
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    'type',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
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
    setTypeFilter(null);
    setStatusFilter(null);
    setPage(1);
  }, [setSearchQuery, setTypeFilter, setStatusFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!typeFilter || !!statusFilter;
  }, [searchQuery, typeFilter, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
  };
}
