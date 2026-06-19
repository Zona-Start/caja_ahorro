import { type QueryClient } from '@tanstack/react-query';
import { TENANT_SETTINGS_KEYS } from '../keys/tenant-settings-keys';
import { tenantSettingsService } from '../services/tenant-settings-service';

export const tenantSettingsListLoader =
  (queryClient: QueryClient) => async () => {
    await queryClient.ensureQueryData({
      queryKey: TENANT_SETTINGS_KEYS.list({ page: 1, limit: 10 }),
      queryFn: () => tenantSettingsService.getAll(),
    });
    return null;
  };
