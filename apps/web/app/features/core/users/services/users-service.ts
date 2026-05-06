import { apiClient } from '@/lib/api-client';
import {
  managePermissionsResponseSchema,
  userDeleteResponseSchema,
  userResponseSchema,
  usersListResponseSchema,
} from '../schemas/users-api.schema';
import { userSchema, type UserMutation } from '../schemas/users.schema';

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tenantId?: string;
}

const buildQueryParams = (params: UsersQueryParams): string => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    ...(params.search ? { search: params.search } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.tenantId ? { tenantId: params.tenantId } : {}),
  });
  return query.toString();
};

export const usersService = {
  getAll: async (params: UsersQueryParams) => {
    const response = await apiClient.get(
      `/core/users?${buildQueryParams(params)}`,
    );
    return usersListResponseSchema.parse(response.data);
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/core/users/${id}`);
    return userResponseSchema.parse(response.data);
  },

  create: async (payload: UserMutation) => {
    const { id, specialPermissionIds, ...createPayload } = payload;

    const response = await apiClient.post('/core/users', createPayload);

    let createdUser;
    if (Array.isArray(response.data)) {
      createdUser = response.data[0]
        ? userSchema.parse(response.data[0])
        : null;
    } else if (response.data && typeof response.data === 'object') {
      createdUser = userSchema.parse(response.data);
    } else {
      createdUser = {
        id: '',
        username: payload.username,
        fullname: payload.fullname,
        email: payload.email,
      };
    }

    if (
      createdUser &&
      specialPermissionIds &&
      specialPermissionIds.length > 0 &&
      createPayload.tenantId
    ) {
      await usersService.managePermissions(
        createdUser.id,
        specialPermissionIds,
        createPayload.tenantId,
      );
    }

    return createdUser;
  },

  update: async (payload: UserMutation) => {
    if (!payload.id) {
      throw new Error('El id del usuario es requerido para actualizar');
    }
    const { id, specialPermissionIds, tenantId, ...updatePayload } = payload;

    const response = await apiClient.patch(`/core/users/${id}`, updatePayload);

    let updatedUser;
    if (Array.isArray(response.data)) {
      updatedUser = response.data[0]
        ? userSchema.parse(response.data[0])
        : null;
    } else if (response.data && typeof response.data === 'object') {
      updatedUser = userSchema.parse(response.data);
    } else {
      updatedUser = { id, ...updatePayload };
    }

    if (specialPermissionIds !== undefined && tenantId && updatedUser) {
      await usersService.managePermissions(id, specialPermissionIds, tenantId);
    }

    return updatedUser;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`/core/users/${id}`);
    return userDeleteResponseSchema.parse(response.data);
  },

  managePermissions: async (
    id: string,
    permissionIds: string[],
    tenantId?: string,
  ) => {
    const response = await apiClient.post(`/core/users/${id}/permissions`, {
      permissionIds,
      tenantId,
    });
    if (typeof response.data === 'string' || Array.isArray(response.data)) {
      return { message: 'Permissions updated successfully' };
    }

    return managePermissionsResponseSchema.parse(response.data);
  },

  save: async (payload: UserMutation) => {
    return payload.id
      ? usersService.update(payload)
      : usersService.create(payload);
  },
};
