'use client';

import { searchParams } from '@repo/shadcn/lib/searchparams';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { MOVEMENT_TYPES } from '../../schemas/inventory-movement-options';

export const MOVEMENT_TYPE_OPTIONS = Object.entries(MOVEMENT_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export function useInventoryMovementFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q
      .withOptions({
        shallow: false,
        throttleMs: 1000,
      })
      .withDefault(''),
  );

  const [itemIdFilter, setItemIdFilter] = useQueryState( // Changed from productIdFilter
    'itemId', // Changed from productId
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [itemTypeFilter, setItemTypeFilter] = useQueryState( // New filter
    'itemType',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [movementTypeFilter, setMovementTypeFilter] = useQueryState(
    'movementType',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [documentTypeFilter, setDocumentTypeFilter] = useQueryState(
    'documentType',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [documentNumberFilter, setDocumentNumberFilter] = useQueryState(
    'documentNumber',
    searchParams.q.withOptions({ shallow: false }).withDefault(''),
  );

  const [page, setPage] = useQueryState(
    'page',
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setPage(1);
    setItemIdFilter(null);
    setItemTypeFilter(null); // Reset new filter
    setMovementTypeFilter(null);
    setDocumentTypeFilter(null);
    setDocumentNumberFilter(null);
  }, [
    setSearchQuery,
    setPage,
    setItemIdFilter,
    setItemTypeFilter, // Added to dependencies
    setMovementTypeFilter,
    setDocumentTypeFilter,
    setDocumentNumberFilter,
  ]);

  const isAnyFilterActive = useMemo(() => {
    return (
      !!searchQuery ||
      !!itemIdFilter ||
      !!itemTypeFilter || // Added to active check
      !!movementTypeFilter ||
      !!documentTypeFilter ||
      !!documentNumberFilter
    );
  }, [
    searchQuery,
    itemIdFilter,
    itemTypeFilter, // Added to dependencies
    movementTypeFilter,
    documentTypeFilter,
    documentNumberFilter,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
    itemIdFilter,
    setItemIdFilter,
    itemTypeFilter, // Return new filter
    setItemTypeFilter, // Return new filter
    movementTypeFilter,
    setMovementTypeFilter,
    documentTypeFilter,
    setDocumentTypeFilter,
    documentNumberFilter,
    setDocumentNumberFilter,
  };
}
