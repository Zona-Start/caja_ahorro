import { z } from 'zod';
import { tenantSettingSchema } from './tenant-settings.schema';

export const tenantSettingResponseSchema = tenantSettingSchema;

export const tenantSettingsMetaSchema = z.object({
  totalItems: z.number(),
  itemCount: z.number(),
  itemsPerPage: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export const tenantSettingsListResponseSchema = z.object({
  data: z.array(tenantSettingSchema),
  meta: tenantSettingsMetaSchema,
});

export const tenantSettingDeleteResponseSchema = z.object({
  message: z.string(),
});

export type TenantSettingsListResponse = z.infer<typeof tenantSettingsListResponseSchema>;