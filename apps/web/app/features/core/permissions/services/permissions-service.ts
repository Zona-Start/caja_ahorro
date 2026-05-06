import { apiClient } from '@/lib/api-client';
import type { PermissionsFilters } from '../hooks/use-permissions-filters';
import {
  permissionDeleteResponseSchema,
  permissionResponseSchema,
  permissionsPaginatedResponseSchema,
} from '../schemas/permissions-api.schema';
import {
  permissionSchema,
  type PermissionMutation,
} from '../schemas/permissions.schema';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const permissionsService = {
  getAll: async (
    filters?: PermissionsFilters,
  ): Promise<
    PaginatedResponse<Awaited<ReturnType<typeof permissionSchema.parse>>>
  > => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.search) params.set('search', filters.search);

    const response = await apiClient.get(
      '/core/roles-permissions/permissions/paginated',
      {
        params,
      },
    );
    const parsed = permissionsPaginatedResponseSchema.parse(response.data);

    return {
      data: parsed.data.map((p) => permissionSchema.parse(p)),
      total: parsed.meta.totalCount,
      page: parsed.meta.page,
      limit: parsed.meta.limit,
      totalPages: parsed.meta.totalPages,
    };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(
      `/core/roles-permissions/permissions/${id}`,
    );
    return permissionResponseSchema.parse(response.data);
  },

  create: async (payload: PermissionMutation) => {
    const response = await apiClient.post(
      '/core/roles-permissions/permissions',
      payload,
    );
    if (Array.isArray(response.data)) {
      return response.data[0] ? permissionSchema.parse(response.data[0]) : null;
    }
    return permissionSchema.parse(response.data);
  },

  update: async (payload: PermissionMutation) => {
    if (!payload.id) {
      throw new Error('El id del permiso es requerido para actualizar');
    }
    const { id, ...updatePayload } = payload;
    const response = await apiClient.patch(
      `/core/roles-permissions/permissions/${id}`,
      updatePayload,
    );
    if (Array.isArray(response.data)) {
      return response.data[0] ? permissionSchema.parse(response.data[0]) : null;
    }
    return permissionSchema.parse(response.data);
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(
      `/core/roles-permissions/permissions/${id}`,
    );
    if (response.status === 204) {
      return { message: 'Permission deleted successfully' };
    }
    return permissionDeleteResponseSchema.parse(response.data);
  },

  save: async (payload: PermissionMutation) => {
    return payload.id
      ? permissionsService.update(payload)
      : permissionsService.create(payload);
  },
};
