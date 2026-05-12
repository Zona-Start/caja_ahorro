import { apiClient } from '@/lib/api-client';
import {
  categoryResponseSchema,
  categoriesListResponseSchema,
} from '../schemas/categories-api.schema';
import { categorySchema, type Category, type CategoryMutation } from '../schemas/categories.schema';

export interface CategoriesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
}

export interface CategoriesPaginatedResponse {
  data: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const buildQueryParams = (params: CategoriesQueryParams): string => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    ...(params.search ? { search: params.search } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.isActive !== undefined ? { isActive: String(params.isActive) } : {}),
  });
  return query.toString();
};

export const categoriesService = {
  getAll: async (params: CategoriesQueryParams): Promise<CategoriesPaginatedResponse> => {
    const response = await apiClient.get(
      `/core/categories?${buildQueryParams(params)}`,
    );

    try {
      const parsed = categoriesListResponseSchema.parse(response.data);
      return parsed;
    } catch {
      const data = response.data.data ?? response.data;
      return {
        data,
        total: response.data.total ?? data?.length ?? 0,
        page: response.data.page ?? 1,
        limit: response.data.limit ?? 10,
        totalPages: response.data.totalPages ?? 1,
      };
    }
  },

  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/core/categories/${id}`);
    return categorySchema.parse(response.data);
  },

  create: async (payload: CategoryMutation): Promise<Category> => {
    const { id, ...createPayload } = payload;
    const response = await apiClient.post(
      '/core/categories',
      createPayload,
    );
    return categorySchema.parse(response.data);
  },

  update: async (payload: CategoryMutation): Promise<Category> => {
    if (!payload.id) {
      throw new Error('El id de la categoría es requerido para actualizar');
    }
    const { id, ...updatePayload } = payload;
    const response = await apiClient.patch(
      `/core/categories/${id}`,
      updatePayload,
    );
    return categorySchema.parse(response.data);
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/core/categories/${id}`);
    return categoryResponseSchema.parse(response.data);
  },

  save: async (payload: CategoryMutation) => {
    return payload.id
      ? categoriesService.update(payload)
      : categoriesService.create(payload);
  },
};