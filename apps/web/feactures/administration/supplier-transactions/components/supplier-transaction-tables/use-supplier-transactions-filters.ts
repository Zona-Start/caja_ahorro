'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import {
  SUPPLIER_TRANSACTION_STATUS_TYPES,
  SUPPLIER_TRANSACTION_TYPES,
} from '../../schemas/supplier-transaction-options';

export const SUPPLIER_TRANSACTION_STATUS_OPTIONS = Object.entries(
  SUPPLIER_TRANSACTION_STATUS_TYPES,
).map(([value, label]) => ({
  value,
  label,
}));

export const SUPPLIER_TRANSACTION_TYPE_OPTIONS = Object.entries(
  SUPPLIER_TRANSACTION_TYPES,
).map(([value, label]) => ({
  value,
  label,
}));

export function useSupplierTransactionsFilters() {
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

  const [transactionTypeFilter, setTransactionTypeFilter] = useQueryState(
    'transactionType',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setTransactionTypeFilter(null);

    setPage(1);
  }, [setSearchQuery, setStatusFilter, setTransactionTypeFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!statusFilter || !!transactionTypeFilter;
  }, [searchQuery, statusFilter, transactionTypeFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    transactionTypeFilter,
    setTransactionTypeFilter,
  };
}
