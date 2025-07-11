'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import {
  ESTATUS_TYPES,
  SUPPLIER_CATEGORY_TYPES,
} from '../../schemas/suppliers-options';

export const ESTATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const SUPPLIER_CATEGORY_OPTIONS = Object.entries(
  SUPPLIER_CATEGORY_TYPES,
).map(([value, label]) => ({
  value: value.toString(),
  label,
}));

export function useSupplierFilters() {
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

  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [categoryFilter, setCategoryFilter] = useQueryState(
    'category',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setCategoryFilter(null);
    setPage(1);
  }, [setSearchQuery, setStatusFilter, setCategoryFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!statusFilter || !!categoryFilter;
  }, [searchQuery, statusFilter, categoryFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
  };
}
