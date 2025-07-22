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

  const [suppliersIdFilter, setSuppliersIdFilter] = useQueryState(
    'suppliersId',
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
    setSuppliersIdFilter(null);
    setStatusFilter(null);
  }, [setSearchQuery, setPage, setSuppliersIdFilter, setStatusFilter]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!suppliersIdFilter || !!statusFilter;
  }, [searchQuery, suppliersIdFilter, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    suppliersIdFilter,
    setSuppliersIdFilter,
    statusFilter,
    setStatusFilter,
  };
}
