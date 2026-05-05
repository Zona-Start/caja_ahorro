import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { withdrawalService } from '../services/withdrawal-service';

export const withdrawalLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';

    const filters = { page, limit, search, type, status };

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.withdrawals.list(JSON.stringify(filters)),
      queryFn: () => withdrawalService.getWithdrawals(filters),
    });
  };
