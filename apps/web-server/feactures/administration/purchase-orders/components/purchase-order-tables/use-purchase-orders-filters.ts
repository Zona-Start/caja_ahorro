'use client';

import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { ESTATUS_TYPES } from '../../schemas/purchase-order-options';
import { searchParams } from '../../utils';

export const ESTATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function usePurchaseOrdersFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 1500,
      })
      .withDefault(''),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [supplierIdFilter, setSupplierIdFilter] = useQueryState(
    'supplierId',
    searchParams.supplierId.withOptions({ shallow: false }),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setSupplierIdFilter(null);

    setPage(1);
  }, [setSearchQuery, setStatusFilter, setSupplierIdFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!statusFilter;
  }, [searchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    supplierIdFilter,
    setSupplierIdFilter,
  };
}
