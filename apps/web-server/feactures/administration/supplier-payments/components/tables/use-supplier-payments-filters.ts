'use client';

import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { SUPPLIER_PAYMENT_STATUS_TYPES } from '../../schemas';
import { searchParams } from '../../utils';

export const SUPPLIER_PAYMENT_STATUS_OPTIONS = Object.entries(
  SUPPLIER_PAYMENT_STATUS_TYPES,
).map(([value, label]) => ({
  value,
  label,
}));

export function useSupplierPaymentsFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 1500,
      })
      .withDefault(''),
  );

  const [tab, setTab] = useQueryState(
    'tab',
    searchParams.tab.withOptions({ shallow: false }).withDefault('history'),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    searchParams.status.withOptions({ shallow: false }).withDefault(''),
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
    setTab('history');
    setStatusFilter(null);
    setSupplierIdFilter(null);
    setPage(1);
  }, [setSearchQuery, setTab, setStatusFilter, setSupplierIdFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!statusFilter || !!supplierIdFilter;
  }, [searchQuery, statusFilter, supplierIdFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    tab,
    setTab,
    statusFilter,
    setStatusFilter,
    supplierIdFilter,
    setSupplierIdFilter,
  };
}
