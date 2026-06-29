import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const inventoryServicesFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  categoryId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type InventoryServicesFilters = z.infer<typeof inventoryServicesFilterSchema>;

export function useInventoryServicesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const status = searchParams.get('status') || '';
  const categoryId = searchParams.get('categoryId') || '';

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  useEffect(() => { setLocalSearch(urlSearch); setDebouncedSearch(urlSearch); }, [urlSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(localSearch), 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    const p = new URLSearchParams(searchParams);
    if (debouncedSearch) p.set('search', debouncedSearch);
    else p.delete('search');
    p.delete('page');
    setSearchParams(p);
  }, [debouncedSearch]);

  const filters = { page, limit, search: debouncedSearch, status, categoryId };

  const setFilters = useCallback((newFilters: Partial<InventoryServicesFilters>) => {
    const p = new URLSearchParams(searchParams);
    if (newFilters.page !== undefined) {
      if (newFilters.page > 1) p.set('page', String(newFilters.page));
      else p.delete('page');
    }
    if (newFilters.limit !== undefined) {
      if (newFilters.limit !== 10) p.set('limit', String(newFilters.limit));
      else p.delete('limit');
    }
    if (newFilters.status !== undefined) {
      if (newFilters.status) p.set('status', newFilters.status);
      else p.delete('status');
    }
    if (newFilters.categoryId !== undefined) {
      if (newFilters.categoryId) p.set('categoryId', newFilters.categoryId);
      else p.delete('categoryId');
    }
    setSearchParams(p, { preventScrollReset: true });
  }, [searchParams, setSearchParams]);

  const clearFilters = useCallback(() => {
    setLocalSearch('');
    setDebouncedSearch('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const isAnyFilterActive = useMemo(() => !!(debouncedSearch || status || categoryId), [debouncedSearch, status, categoryId]);

  return {
    search: localSearch,
    setSearch: (v: string) => setLocalSearch(v),
    filters,
    setFilters,
    clearFilters,
    isAnyFilterActive,
  };
}
