import { useSearchParams } from 'react-router';

export function useLoansPaidFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search');
  const bank = searchParams.get('bank');
  const type = searchParams.get('type');
  const method = searchParams.get('method');

  const setFilters = (newFilters: {
    page?: number;
    limit?: number;
    search?: string | null;
    bank?: string | null;
    type?: string | null;
    method?: string | null;
  }) => {
    setSearchParams((prev) => {
      if (newFilters.page !== undefined) prev.set('page', newFilters.page.toString());
      if (newFilters.limit !== undefined) prev.set('limit', newFilters.limit.toString());
      if (newFilters.search !== undefined) {
        if (newFilters.search === null || newFilters.search === '') {
          prev.delete('search');
        } else {
          prev.set('search', newFilters.search);
        }
        prev.set('page', '1');
      }
      if (newFilters.bank !== undefined) {
        if (newFilters.bank === null || newFilters.bank === '') {
          prev.delete('bank');
        } else {
          prev.set('bank', newFilters.bank);
        }
        prev.set('page', '1');
      }
      if (newFilters.type !== undefined) {
        if (newFilters.type === null || newFilters.type === '') {
          prev.delete('type');
        } else {
          prev.set('type', newFilters.type);
        }
        prev.set('page', '1');
      }
      if (newFilters.method !== undefined) {
        if (newFilters.method === null || newFilters.method === '') {
          prev.delete('method');
        } else {
          prev.set('method', newFilters.method);
        }
        prev.set('page', '1');
      }
      return prev;
    });
  };

  return {
    filters: { page, limit, search, bank, type, method },
    setFilters,
  };
}
