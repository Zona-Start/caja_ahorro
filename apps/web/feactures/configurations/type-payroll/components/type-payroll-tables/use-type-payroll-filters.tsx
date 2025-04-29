'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { GROUP_TYPES } from '../../schemas/type-payroll-options';

export const GROUPS_TYPES = Object.entries(GROUP_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function useTypePayrollFilters() {
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

  const [groupFilter, setGroupFilter] = useQueryState(
    'group',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setGroupFilter(null);
    setPage(1);
  }, [setSearchQuery, setGroupFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!groupFilter;
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    groupFilter,
    setGroupFilter,
  };
}
