import { useCallback, useMemo } from 'react';
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

  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const status = searchParams.get('status') || '';
  const categoryId = searchParams.get('categoryId') || '';

  const setFilters = useCallback(
    (filters: Partial<ProductsFilters>) => {
      const newParams = new URLSearchParams(searchParams);
      if (filters.search !== undefined) {
        if (filters.search) newParams.set('search', filters.search);
        else newParams.delete('search');
      }
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
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const isAnyFilterActive = useMemo(() => {
    return !!(search || status || categoryId);
  }, [search, status, categoryId]);

  return {
    search,
    setSearch: (value: string) => setFilters({ search: value, page: 1 }),
    page,
    setPage: (value: number) => setFilters({ page: value }),
    limit,
    setLimit: (value: number) => setFilters({ limit: value, page: 1 }),
    status,
    setStatus: (value: string) => setFilters({ status: value, page: 1 }),
    categoryId,
    setCategoryId: (value: string) => setFilters({ categoryId: value, page: 1 }),
    filters: { page, limit, search, status, categoryId },
    resetFilters,
    isAnyFilterActive,
  };
}
