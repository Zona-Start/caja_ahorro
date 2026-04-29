'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { ESTATUS_TYPES } from '../../schemas/fixed-asset-options';

export const ESTATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function useFixedAssetFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 1000, // Add 500ms delay
        // Removed dedupingInterval as it's not a valid option
      })
      .withDefault(''),
  );

  const [typeCategoryFilter, setCategoryTypeFilter] = useQueryState(
    'typeCategory',
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
    setPage(1);
    setCategoryTypeFilter(null);
    setStatusFilter(null);
  }, [setSearchQuery, setPage, setCategoryTypeFilter, setStatusFilter]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!typeCategoryFilter || !!statusFilter;
  }, [searchQuery, typeCategoryFilter, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    typeCategoryFilter,
    setCategoryTypeFilter,
    statusFilter,
    setStatusFilter,
  };
}
