'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import {
  ESTATUS_TYPES,
  lOAN_MODALITY,
} from '../../schemas/loans-management-options';

export const ESTATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const lOAN_MODALITY_OPTIONS = Object.entries(lOAN_MODALITY).map(
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

  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [typeFilter, setTypeFilter] = useQueryState(
    'type',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [modalityFilter, setModalityFilter] = useQueryState(
    'modality',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setTypeFilter(null);
    setModalityFilter(null);
    setPage(1);
  }, [
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setModalityFilter,
    setPage,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!statusFilter || !!typeFilter || !!modalityFilter;
  }, [searchQuery, statusFilter, typeFilter, modalityFilter]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    modalityFilter,
    setModalityFilter,
  };
}
