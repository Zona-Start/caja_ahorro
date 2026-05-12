import { apiClient } from '@/lib/api-client';
import type { CategoriesFilters } from '../hooks/use-categories-filters';
import {
  categoriesPaginatedResponseSchema,
  categoriesListResponseSchema,
  categoryDeleteResponseSchema,
} from '../schemas/categories-api.schema';
import {
  categorySchema,
  type Category,
  type CategoryMutation,
} from '../schemas/categories.schema';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const categoriesService = {
  getAll: async (
    filters?: CategoriesFilters,
  ): Promise<PaginatedResponse<Category>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.search) params.set('search', filters.search);
    if (filters?.group) params.set('group', filters.group);

    const response = await apiClient.get('/inventory/categories/paginated', {
      params,
    });
    const parsed = categoriesPaginatedResponseSchema.parse(response.data);

    return {
      data: parsed.data.map((c) => categorySchema.parse(c)),
      total: parsed.meta.totalCount,
      page: parsed.meta.page,
      limit: parsed.meta.limit,
      totalPages: parsed.meta.totalPages,
    };
  },

  getAllList: async (): Promise<Category[]> => {
    const response = await apiClient.get('/inventory/categories');
    return categoriesListResponseSchema.parse(response.data);
  },

  getByGroup: async (group: string): Promise<Category[]> => {
    const response = await apiClient.get(`/inventory/categories/group/${group}`);
    return categoriesListResponseSchema.parse(response.data);
  },

  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/inventory/categories/${id}`);
    return categorySchema.parse(response.data);
  },

  create: async (payload: CategoryMutation): Promise<Category> => {
    const { id, ...createPayload } = payload;
    const response = await apiClient.post('/inventory/categories', createPayload);
    if (Array.isArray(response.data)) {
      return response.data[0] ? categorySchema.parse(response.data[0]) : ({} as Category);
    }
    return categorySchema.parse(response.data);
  },

  update: async (payload: CategoryMutation): Promise<Category> => {
    if (!payload.id) {
      throw new Error('El id de la categoría es requerido para actualizar');
    }
    const { id, ...updatePayload } = payload;
    const response = await apiClient.patch(
      `/inventory/categories/${id}`,
      updatePayload,
    );
    if (Array.isArray(response.data)) {
      return response.data[0] ? categorySchema.parse(response.data[0]) : ({} as Category);
    }
    return categorySchema.parse(response.data);
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/inventory/categories/${id}`);
    if (response.status === 204) {
      return { message: 'Categoría eliminada correctamente' };
    }
    return categoryDeleteResponseSchema.parse(response.data);
  },

  save: async (payload: CategoryMutation): Promise<Category> => {
    return payload.id
      ? categoriesService.update(payload)
      : categoriesService.create(payload);
  },
};
