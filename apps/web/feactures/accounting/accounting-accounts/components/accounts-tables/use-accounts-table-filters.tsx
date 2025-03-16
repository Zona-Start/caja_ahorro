'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import {
  ACCOUNT_LEVELS,
  ACCOUNT_TYPES,
} from '../../schemas/account-plan-options';

export const TYPE_OPTIONS = Object.entries(ACCOUNT_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const LEVEL_OPTIONS = Object.entries(ACCOUNT_LEVELS).map(
  ([value, label]) => ({
    value: value.toString(),
    label,
  }),
);

export function useAccountsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 500, // Add 500ms delay
        // Removed dedupingInterval as it's not a valid option
      })
      .withDefault(''),
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    'type',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [levelFilter, setLevelFilter] = useQueryState(
    'level',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setTypeFilter(null);
    setLevelFilter(null);
    setPage(1);
  }, [setSearchQuery, setTypeFilter, setLevelFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!typeFilter || !!levelFilter;
  }, [searchQuery, typeFilter, levelFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    typeFilter,
    setTypeFilter,
    levelFilter,
    setLevelFilter,
  };
}
