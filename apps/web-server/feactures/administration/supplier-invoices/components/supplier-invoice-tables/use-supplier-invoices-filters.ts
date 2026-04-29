'use client';

import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { SUPPLIER_INVOICE_STATUS_TYPES } from '../../schemas/supplier-invoice-options';
import { searchParams } from '../../utils';

export const SUPPLIER_INVOICE_STATUS_OPTIONS = Object.entries(
  SUPPLIER_INVOICE_STATUS_TYPES,
).map(([value, label]) => ({
  value,
  label,
}));

export function useSupplierInvoicesFilters() {
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
  }, [setSearchQuery, setStatusFilter, setPage, setSupplierIdFilter]);

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
    setSupplierIdFilter,
    supplierIdFilter,
  };
}
