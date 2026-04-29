'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { SERVICE_STATUS_TYPES } from '../../schemas/service-options';

export const SERVICE_STATUS_OPTIONS = Object.entries(SERVICE_STATUS_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function useServiceFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 1000,
      })
      .withDefault(''),
  );

  const [categoryIdFilter, setCategoryIdFilter] = useQueryState(
    'categoryId',
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
    setCategoryIdFilter(null);
    setStatusFilter(null);
  }, [setSearchQuery, setPage, setCategoryIdFilter, setStatusFilter]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!categoryIdFilter || !!statusFilter;
  }, [searchQuery, categoryIdFilter, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    categoryIdFilter,
    setCategoryIdFilter,
    statusFilter,
    setStatusFilter,
  };
}
