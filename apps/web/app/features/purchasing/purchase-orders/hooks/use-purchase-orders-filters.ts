import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const purchaseOrdersFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  supplierId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type PurchaseOrdersFilters = z.infer<typeof purchaseOrdersFilterSchema>;

export function usePurchaseOrdersFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const status = searchParams.get('status') || '';
  const supplierId = searchParams.get('supplierId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
    setDebouncedSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(localSearch), 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    if (debouncedSearch === search) return;
    const p = new URLSearchParams(searchParams);
    if (debouncedSearch) p.set('search', debouncedSearch);
    else p.delete('search');
    p.delete('page');
    setSearchParams(p);
  }, [debouncedSearch]);

  const setFilters = useCallback(
    (filters: Partial<PurchaseOrdersFilters>) => {
      const p = new URLSearchParams(searchParams);
      if (filters.page !== undefined) {
        if (filters.page > 1) p.set('page', String(filters.page));
        else p.delete('page');
      }
      if (filters.limit !== undefined) {
        if (filters.limit !== 10) p.set('limit', String(filters.limit));
        else p.delete('limit');
      }
      if (filters.status !== undefined) {
        if (filters.status) p.set('status', filters.status);
        else p.delete('status');
      }
      if (filters.supplierId !== undefined) {
        if (filters.supplierId) p.set('supplierId', filters.supplierId);
        else p.delete('supplierId');
      }
      if (filters.startDate !== undefined) {
        if (filters.startDate) p.set('startDate', filters.startDate);
        else p.delete('startDate');
      }
      if (filters.endDate !== undefined) {
        if (filters.endDate) p.set('endDate', filters.endDate);
        else p.delete('endDate');
      }
      setSearchParams(p);
    },
    [searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setLocalSearch('');
    setDebouncedSearch('');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const isAnyFilterActive = useMemo(
    () => !!(debouncedSearch || status || supplierId || startDate || endDate),
    [debouncedSearch, status, supplierId, startDate, endDate],
  );

  return {
    search: localSearch,
    setSearch: (v: string) => setLocalSearch(v),
    page,
    setPage: (v: number) => setFilters({ page: v }),
    limit,
    setLimit: (v: number) => setFilters({ limit: v, page: 1 }),
    status,
    setStatus: (v: string | null) => setFilters({ status: v ?? '', page: 1 }),
    supplierId,
    setSupplierId: (v: string | null) => setFilters({ supplierId: v ?? '', page: 1 }),
    startDate,
    setStartDate: (v: string) => setFilters({ startDate: v, page: 1 }),
    endDate,
    setEndDate: (v: string) => setFilters({ endDate: v, page: 1 }),
    filters: { page, limit, search: debouncedSearch, status, supplierId, startDate, endDate },
    resetFilters,
    isAnyFilterActive,
  };
}
