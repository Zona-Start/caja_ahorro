import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { creditManagementService } from '../services/credits-management-service';

export const creditManagementLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const status = url.searchParams.get('status') || '';
    const type = url.searchParams.get('type') || '';
    const modality = url.searchParams.get('modality') || '';
    const search = url.searchParams.get('search') || '';

    const filters = { page, limit, status, type, modality, search };

    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.creditManagements.list(JSON.stringify(filters)),
      queryFn: () => creditManagementService.getCreditManagementAll(filters),
    });
  };
