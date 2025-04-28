'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import {
  ACCOUNT_TYPES,
  CURRENCY_TYPE,
  ESTATUS_TYPES,
} from '../../schemas/bank-account-options';

export const ESTATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const CURRENCIES_OPTIONS = Object.entries(CURRENCY_TYPE).map(
  ([value, label]) => ({
    value: value.toString(),
    label,
  }),
);

export const ACCOUNTS_OPTIONS = Object.entries(ACCOUNT_TYPES).map(
  ([value, label]) => ({
    value: value.toString(),
    label,
  }),
);

export function useBankAccountFilters() {
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

  const [curenciesFilter, setCurenciesFilter] = useQueryState(
    'currencies',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [accountTypeFilter, setAccountTypeFilter] = useQueryState(
    'accountType',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setCurenciesFilter(null);
    setAccountTypeFilter(null);
    setPage(1);
  }, [
    setSearchQuery,
    setStatusFilter,
    setAccountTypeFilter,
    setCurenciesFilter,
    setPage,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      !!statusFilter ||
      !!curenciesFilter ||
      !!accountTypeFilter
    );
  }, [searchQuery, statusFilter, accountTypeFilter, curenciesFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    accountTypeFilter,
    setAccountTypeFilter,
    setCurenciesFilter,
    curenciesFilter,
  };
}
