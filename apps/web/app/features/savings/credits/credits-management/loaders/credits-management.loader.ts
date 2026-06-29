import type { ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { creditManagementService } from '../services/credits-management-service';
import { creditsFilterSchema } from '../hooks/use-credits-filters';

export const creditManagementLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    const url = new URL(request.url);

    const paramsParsed = creditsFilterSchema.parse({
      page: Number(url.searchParams.get('page')) || undefined,
      limit: Number(url.searchParams.get('limit')) || undefined,
      search: url.searchParams.get('search') || undefined,
      status: url.searchParams.get('status') || undefined,
      type: url.searchParams.get('type') || undefined,
      modality: url.searchParams.get('modality') || undefined,
    });

    const data = await queryClient.ensureQueryData({
      queryKey: ['creditManagements', 'list', paramsParsed],
      queryFn: () =>
        creditManagementService.getCreditManagementAll(paramsParsed),
    });

    return { data, filters: paramsParsed };
  };
