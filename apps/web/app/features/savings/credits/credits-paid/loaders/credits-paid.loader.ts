import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { creditsPaidService } from '../services/credits-paid-service';

export const creditsPaidLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const creditId = Number(url.searchParams.get('creditId')) || undefined;

    const filters = { page, limit, search, creditId };

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.creditsPaid.list(JSON.stringify(filters)),
      queryFn: () => creditsPaidService.getCreditsPaid(filters),
    });
  };
