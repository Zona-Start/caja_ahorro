import { useSearchParams } from 'react-router';

export function usePaymentBatchFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const search = searchParams.get('search');
  const status = searchParams.get('status');

  const setFilters = (newFilters: {
    page?: number;
    limit?: number;
    search?: string | null;
    status?: string | null;
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
      if (newFilters.status !== undefined) {
        if (newFilters.status === null || newFilters.status === '') {
          prev.delete('status');
        } else {
          prev.set('status', newFilters.status);
        }
        prev.set('page', '1');
      }
      return prev;
    });
  };

  return {
    filters: { page, limit, search, status },
    setFilters,
  };
}
