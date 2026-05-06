import { QUERY_KEYS } from '@/lib/query-keys';
import { type QueryClient } from '@tanstack/react-query';
import { globalSettingsService } from '../services/global-settings-service';

export const globalSettingsListLoader =
  (queryClient: QueryClient) =>
  async ({ request }: { request: Request }) => {
    await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.globalSettings.list(),
      queryFn: () => globalSettingsService.getAll(),
    });

    return null;
  };