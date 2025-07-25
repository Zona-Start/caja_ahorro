'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export function useInventoryCategoriesFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 1500,
      })
      .withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const [groupFilter, setGroupFilter] = useQueryState(
    'group',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setGroupFilter(null);
    setPage(1);
  }, [setSearchQuery, setPage, setGroupFilter]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!groupFilter;
  }, [searchQuery, groupFilter]);

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
