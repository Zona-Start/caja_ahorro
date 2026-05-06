import { z } from 'zod';
import { globalSettingSchema } from './global-settings.schema';

export const globalSettingResponseSchema = globalSettingSchema;
export const globalSettingsListResponseSchema = z.object({
  data: z.array(globalSettingSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});
export const globalSettingDeleteResponseSchema = z.object({
  message: z.string(),
});