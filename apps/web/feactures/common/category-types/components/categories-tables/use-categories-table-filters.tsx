'use client';

import { searchParams } from '@/feactures/common/category-types/utils/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export function useCategoriesTypesTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 500, // Add 500ms delay
        // Removed dedupingInterval as it's not a valid option
      })
      .withDefault(''),
  );

  const [groupFilter, setGrouFilter] = useQueryState(
    'group',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setGrouFilter(null);
    setPage(1);
  }, [setSearchQuery, setGrouFilter, setPage]);

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
    setGrouFilter,
  };
}
