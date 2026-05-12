import { QueryClient } from '@tanstack/react-query';
import { MODULE_SETTINGS_KEYS } from '../keys/module-settings-keys';
import { moduleSettingsService } from '../services/module-settings-service';

export const moduleSettingsListLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData({
    queryKey: MODULE_SETTINGS_KEYS.list({ page: 1, limit: 10, search: '' }),
    queryFn: () => moduleSettingsService.getAll({ page: 1, limit: 10, search: '' }),
  });
  return null;
};
