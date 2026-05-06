import { apiClient } from '@/lib/api-client';
import {
  globalSettingDeleteResponseSchema,
  globalSettingResponseSchema,
  globalSettingsListResponseSchema,
} from '../schemas/global-settings-api.schema';
import { globalSettingSchema, type GlobalSettingMutation } from '../schemas/global-settings.schema';

export interface GlobalSettingsFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const globalSettingsService = {
  getAll: async (filters?: GlobalSettingsFilters): Promise<PaginatedResponse<Awaited<ReturnType<typeof globalSettingSchema.parse>>>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category) params.set('category', filters.category);

    const response = await apiClient.get('/core/settings/global', { params });
    const parsed = globalSettingsListResponseSchema.parse(response.data);

    return {
      data: parsed.data.map((p) => globalSettingSchema.parse(p)),
      total: parsed.total,
      page: parsed.page,
      limit: parsed.limit,
      totalPages: parsed.totalPages,
    };
  },

  getByKey: async (key: string) => {
    const response = await apiClient.get(`/core/settings/global/${key}`);
    return globalSettingSchema.parse(response.data);
  },

  create: async (payload: GlobalSettingMutation) => {
    const response = await apiClient.post('/core/settings/global', payload);
    if (Array.isArray(response.data)) {
      return response.data[0] ? globalSettingSchema.parse(response.data[0]) : null;
    }
    return globalSettingSchema.parse(response.data);
  },

  update: async (id: string, payload: Partial<GlobalSettingMutation>) => {
    const response = await apiClient.patch(`/core/settings/global/${id}`, payload);
    if (Array.isArray(response.data)) {
      return response.data[0] ? globalSettingSchema.parse(response.data[0]) : null;
    }
    return globalSettingSchema.parse(response.data);
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`/core/settings/global/${id}`);
    if (response.status === 204) {
      return { message: 'Setting deleted successfully' };
    }
    return globalSettingDeleteResponseSchema.parse(response.data);
  },

  save: async (payload: GlobalSettingMutation) => {
    return payload.id
      ? globalSettingsService.update(payload.id, payload)
      : globalSettingsService.create(payload);
  },
};