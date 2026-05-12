import { QueryClient } from '@tanstack/react-query';
import { CURRENCIES_KEYS } from '../keys/currencies-keys';
import { currenciesService } from '../services/currencies-service';

export const currenciesListLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData({
    queryKey: CURRENCIES_KEYS.list({}),
    queryFn: () => currenciesService.getAll(),
  });
  return null;
};
