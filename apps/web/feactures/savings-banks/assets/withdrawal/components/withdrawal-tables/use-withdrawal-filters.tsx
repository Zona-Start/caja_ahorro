'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { PAYMENT_METHOD } from '../../schemas/withdrawal-options';

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD).map(
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

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setTypeFilter(null);
    setPage(1);
  }, [setSearchQuery, setTypeFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!typeFilter;
  }, [searchQuery, typeFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    typeFilter,
    setTypeFilter,
  };
}
