import { QueryClient } from '@tanstack/react-query';
import { CATEGORIES_KEYS } from '../keys/categories-keys';
import { categoriesService } from '../services/categories-service';

export const categoriesListLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData({
    queryKey: CATEGORIES_KEYS.list({ page: 1, limit: 10, search: '' }),
    queryFn: () => categoriesService.getAll({ page: 1, limit: 10, search: '' }),
  });
  return null;
};
