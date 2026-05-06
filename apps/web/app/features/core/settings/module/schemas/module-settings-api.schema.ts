import { z } from 'zod';
import { moduleSettingSchema } from './module-settings.schema';

export const moduleSettingResponseSchema = moduleSettingSchema;
export const moduleSettingsListResponseSchema = z.object({
  data: z.array(moduleSettingSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});
export const moduleSettingDeleteResponseSchema = z.object({
  message: z.string(),
});