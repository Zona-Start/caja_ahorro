import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { loansPaidService } from '../services/loans-paid-service';

export const loansPaidLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const loanId = Number(url.searchParams.get('loanId')) || undefined;

    const filters = { page, limit, search, loanId };

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.loansPaid.list(JSON.stringify(filters)),
      queryFn: () => loansPaidService.getLoansPaid(filters),
    });
  };
