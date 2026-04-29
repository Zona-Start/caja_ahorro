'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import {
  CREDIT_PAYMENT_TYPES,
  PAYMENT_METHOD,
} from '../../schemas/credits-paid-options';

export const CREDIT_PAYMENT_TYPES_OPTIONS = Object.entries(
  CREDIT_PAYMENT_TYPES,
).map(([value, label]) => ({
  value,
  label,
}));

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function useAssociatesTableFilters() {
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

  const [bankFilter, setBankFilter] = useQueryState(
    'bank',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    'type',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [methodFilter, setMethodFilter] = useQueryState(
    'method',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setBankFilter(null);
    setTypeFilter(null);
    setMethodFilter(null);
    setPage(1);
  }, [setSearchQuery, setBankFilter, setTypeFilter, setMethodFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!bankFilter || !!typeFilter || !!methodFilter;
  }, [searchQuery, bankFilter, typeFilter, methodFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    bankFilter,
    setBankFilter,
    typeFilter,
    setTypeFilter,
    methodFilter,
    setMethodFilter,
  };
}
