import { z } from 'zod';
import { tenantSettingSchema } from './tenant-settings.schema';

export const tenantSettingResponseSchema = tenantSettingSchema;
export const tenantSettingsListResponseSchema = z.array(tenantSettingSchema);
export const tenantSettingDeleteResponseSchema = z.object({
  message: z.string(),
});