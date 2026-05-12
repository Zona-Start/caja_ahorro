import { apiClient } from '@/lib/api-client';
import {
  tenantSettingDeleteResponseSchema,
  tenantSettingResponseSchema,
  tenantSettingsListResponseSchema,
} from '../schemas/tenant-settings-api.schema';
import { tenantSettingSchema, type TenantSettingMutation } from '../schemas/tenant-settings.schema';

export interface TenantSettingsFilters {
  tenantId?: string;
  category?: string;
}

export const tenantSettingsService = {
  getAll: async (filters?: TenantSettingsFilters) => {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);

    const response = await apiClient.get('/core/tenants/settings', { params });
    const data = tenantSettingsListResponseSchema.parse(response.data);
    return data.map((p) => tenantSettingSchema.parse(p));
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/core/tenants/settings/${id}`);
    return tenantSettingSchema.parse(response.data);
  },

  update: async (id: string, payload: Partial<TenantSettingMutation>) => {
    const response = await apiClient.patch(`/core/tenants/settings/${id}`, payload);
    if (Array.isArray(response.data)) {
      return response.data[0] ? tenantSettingSchema.parse(response.data[0]) : null;
    }
    return tenantSettingSchema.parse(response.data);
  },

  save: async (payload: TenantSettingMutation) => {
    return tenantSettingsService.update(payload.id!, payload);
  },
};