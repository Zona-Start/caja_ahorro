import { apiClient } from '@/lib/api-client';
import {
  tenantSettingDeleteResponseSchema,
  tenantSettingResponseSchema,
  tenantSettingsListResponseSchema,
  type TenantSettingsListResponse,
} from '../schemas/tenant-settings-api.schema';
import {
  tenantSettingSchema,
  type TenantSettingMutation,
} from '../schemas/tenant-settings.schema';
import type { TenantSettingsFilters } from '../hooks/use-tenant-settings-filters';

export const tenantSettingsService = {
  getAll: async (
    filters?: TenantSettingsFilters,
  ): Promise<TenantSettingsListResponse> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.set('tenantId', filters.tenantId);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const response = await apiClient.get('/core/tenants-settings', { params });

    return tenantSettingsListResponseSchema.parse(response.data);
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/core/tenants-settings/${id}`);
    return tenantSettingSchema.parse(response.data);
  },

  create: async (payload: TenantSettingMutation) => {
    const params = new URLSearchParams();
    if (payload.tenantId) params.set('tenantId', payload.tenantId);

    const response = await apiClient.post('/core/tenants-settings', payload, {
      params,
    });
    if (Array.isArray(response.data)) {
      return response.data[0] ? tenantSettingSchema.parse(response.data[0]) : null;
    }
    return tenantSettingSchema.parse(response.data);
  },

  update: async (id: string, payload: Partial<TenantSettingMutation>) => {
    const response = await apiClient.patch(
      `/core/tenants-settings/${id}`,
      payload,
    );
    if (Array.isArray(response.data)) {
      return response.data[0] ? tenantSettingSchema.parse(response.data[0]) : null;
    }
    return tenantSettingSchema.parse(response.data);
  },

  save: async (payload: TenantSettingMutation) => {
    if (payload.id) {
      return tenantSettingsService.update(payload.id, payload);
    }
    return tenantSettingsService.create(payload);
  },
};
