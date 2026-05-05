import { useSearchParams } from 'react-router';
import { useCallback, useMemo } from 'react';

export function useAccountingRulesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;

  const setFilters = useCallback(
    (filters: { q?: string | null; page?: number | null }) => {
      const newParams = new URLSearchParams(searchParams);
      if (filters.q !== undefined) {
        if (filters.q) newParams.set('q', filters.q);
        else newParams.delete('q');
      }
      if (filters.page !== undefined) {
        if (filters.page && filters.page !== 1) newParams.set('page', String(filters.page));
        else newParams.delete('page');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery;
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery: (q: string | null) => setFilters({ q }),
    page,
    setPage: (page: number | null) => setFilters({ page }),
    resetFilters,
    isAnyFilterActive,
  };
}
