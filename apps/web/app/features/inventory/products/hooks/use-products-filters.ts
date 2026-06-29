import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const productsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  categoryId: z.string().optional(),
});

export type ProductsFilters = z.infer<typeof productsFilterSchema>;

export function useProductsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const status = searchParams.get('status') || '';
  const categoryId = searchParams.get('categoryId') || '';

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  useEffect(() => {
    setLocalSearch(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    const newParams = new URLSearchParams(searchParams);
    if (debouncedSearch) newParams.set('search', debouncedSearch);
    else newParams.delete('search');
    newParams.delete('page');
    setSearchParams(newParams);
  }, [debouncedSearch]);

  const setFilters = useCallback(
    (filters: Partial<ProductsFilters>) => {
      const newParams = new URLSearchParams(searchParams);
      if (filters.page !== undefined) {
        if (filters.page && filters.page !== 1)
          newParams.set('page', String(filters.page));
        else newParams.delete('page');
      }
      if (filters.limit !== undefined) {
        if (filters.limit && filters.limit !== 10)
          newParams.set('limit', String(filters.limit));
        else newParams.delete('limit');
      }
      if (filters.status !== undefined) {
        if (filters.status) newParams.set('status', filters.status);
        else newParams.delete('status');
      }
      if (filters.categoryId !== undefined) {
        if (filters.categoryId) newParams.set('categoryId', filters.categoryId);
        else newParams.delete('categoryId');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setLocalSearch('');
    setDebouncedSearch('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const isAnyFilterActive = useMemo(() => {
    return !!(debouncedSearch || status || categoryId);
  }, [debouncedSearch, status, categoryId]);

  return {
    search: localSearch,
    setSearch: (value: string) => {
      setLocalSearch(value);
    },
    page,
    setPage: (value: number) => setFilters({ page: value }),
    limit,
    setLimit: (value: number) => setFilters({ limit: value, page: 1 }),
    status,
    setStatus: (value: string | null) => setFilters({ status: value ?? '', page: 1 }),
    categoryId,
    setCategoryId: (value: string | null) => setFilters({ categoryId: value ?? '', page: 1 }),
    filters: { page, limit, search: debouncedSearch, status, categoryId },
    resetFilters,
    isAnyFilterActive,
  };
}
