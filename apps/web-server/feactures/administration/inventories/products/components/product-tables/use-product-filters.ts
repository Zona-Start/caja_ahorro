'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { PRODUCT_STATUS_TYPES } from '../../schemas/product-options';

export const PRODUCT_STATUS_OPTIONS = Object.entries(PRODUCT_STATUS_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function useProductFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 1000,
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
