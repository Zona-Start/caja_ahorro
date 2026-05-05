import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { settlementService } from '../services/settlement-service';

export const settlementLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';

    const filters = { page, limit, search };

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.settlements.list(JSON.stringify(filters)),
      queryFn: () => settlementService.getSettlements(filters),
    });
  };
