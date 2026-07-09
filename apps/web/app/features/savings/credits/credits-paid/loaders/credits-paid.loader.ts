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
    const bank = url.searchParams.get('bank') || '';
    const type = url.searchParams.get('type') || '';
    const method = url.searchParams.get('method') || '';

    const params = { page, limit, ...(search && { search }), ...(bank && { bank }), ...(type && { type }), ...(method && { method }) };

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.creditsPaid.list(params),
      queryFn: () => creditsPaidService.getCreditsPaid(params as { page: number; limit: number; search?: string; bank?: string; type?: string; method?: string }),
    });
  };
