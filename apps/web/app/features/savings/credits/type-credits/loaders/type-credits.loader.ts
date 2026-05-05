import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { typeCreditsService } from '../services/type-credits-service';

export const typeCreditsLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.typeCredits.all(),
      queryFn: () => typeCreditsService.getAll(),
    });
  };
