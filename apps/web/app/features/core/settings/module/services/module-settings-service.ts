import { apiClient } from '@/lib/api-client';
import {
  moduleSettingDeleteResponseSchema,
  moduleSettingResponseSchema,
  moduleSettingsListResponseSchema,
} from '../schemas/module-settings-api.schema';
import { moduleSettingSchema, type ModuleSettingMutation } from '../schemas/module-settings.schema';

export interface ModuleSettingsFilters {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  submodule?: string;
  tenantId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const moduleSettingsService = {
  getAll: async (filters?: ModuleSettingsFilters): Promise<PaginatedResponse<Awaited<ReturnType<typeof moduleSettingSchema.parse>>>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.search) params.set('search', filters.search);
    if (filters?.module) params.set('module', filters.module);
    if (filters?.submodule) params.set('submodule', filters.submodule);
    if (filters?.tenantId) params.set('tenantId', filters.tenantId);

    const response = await apiClient.get('/core/settings/module', { params });
    const parsed = moduleSettingsListResponseSchema.parse(response.data);

    return {
      data: parsed.data.map((p) => moduleSettingSchema.parse(p)),
      total: parsed.total,
      page: parsed.page,
      limit: parsed.limit,
      totalPages: parsed.totalPages,
    };
  },

  create: async (payload: ModuleSettingMutation) => {
    const response = await apiClient.post('/core/settings/module', payload);
    if (Array.isArray(response.data)) {
      return response.data[0] ? moduleSettingSchema.parse(response.data[0]) : null;
    }
    return moduleSettingSchema.parse(response.data);
  },

  update: async (id: string, payload: Partial<ModuleSettingMutation>) => {
    const response = await apiClient.patch(`/core/settings/module/${id}`, payload);
    if (Array.isArray(response.data)) {
      return response.data[0] ? moduleSettingSchema.parse(response.data[0]) : null;
    }
    return moduleSettingSchema.parse(response.data);
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`/core/settings/module/${id}`);
    if (response.status === 204) {
      return { message: 'Setting deleted successfully' };
    }
    return moduleSettingDeleteResponseSchema.parse(response.data);
  },

  save: async (payload: ModuleSettingMutation) => {
    return payload.id
      ? moduleSettingsService.update(payload.id, payload)
      : moduleSettingsService.create(payload);
  },
};