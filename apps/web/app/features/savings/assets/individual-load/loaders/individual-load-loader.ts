import { type ClientLoaderFunctionArgs } from 'react-router';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { individualLoadService } from '../services/individual-load-service';

export const individualLoadLoader =
  (queryClient: QueryClient) =>
  async ({ request }: ClientLoaderFunctionArgs) => {
    // Si necesitáramos pre-cargar datos comunes (como bancos para el select)
    // return await queryClient.ensureQueryData({
    //   queryKey: QUERY_KEYS.banks.all(),
    //   queryFn: () => bankService.getAll(),
    // });
    return null;
  };
