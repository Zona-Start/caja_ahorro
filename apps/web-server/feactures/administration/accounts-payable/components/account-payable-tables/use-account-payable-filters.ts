'use client';

import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { ACCOUNT_PAYABLE_STATUS_TYPES } from '../../schemas/account-payable-options';
import { searchParams } from '../../utils';

export const ACCOUNT_PAYABLE_STATUS_OPTIONS = Object.entries(
  ACCOUNT_PAYABLE_STATUS_TYPES,
).map(([value, label]) => ({
  value,
  label,
}));

export function useAccountPayableFilters() {
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
    setStatusFilter(null);
    setSupplierIdFilter(null);

    setPage(1);
  }, [setSearchQuery, setStatusFilter, setSupplierIdFilter, setPage]);

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
    statusFilter,
    setStatusFilter,
    supplierIdFilter,
    setSupplierIdFilter,
  };
}
