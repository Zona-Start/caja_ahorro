import { apiClient } from '@/lib/api-client';
import {
  assignPermissionsResponseSchema,
  permissionsListResponseSchema,
  roleDeleteResponseSchema,
  rolePermissionsResponseSchema,
  roleResponseSchema,
  rolesListResponseSchema,
} from '../schemas/roles-api.schema';
import { roleSchema, type RoleMutation } from '../schemas/roles.schema';

export interface RolesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tenantId?: string;
}

const buildQueryParams = (params: RolesQueryParams): string => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    ...(params.search ? { search: params.search } : {}),
    ...(params.tenantId ? { tenantId: params.tenantId } : {}),
  });
  return query.toString();
};

export const rolesService = {
  getAll: async (params: RolesQueryParams) => {
    const response = await apiClient.get(
      `/core/roles-permissions/roles?${buildQueryParams(params)}`,
    );
    return rolesListResponseSchema.parse(response.data);
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/core/roles-permissions/roles/${id}`);
    return roleResponseSchema.parse(response.data);
  },

  create: async (payload: RoleMutation) => {
    const { permissionIds, tenantId, name, description, isDefault } = payload;

    if (!tenantId) {
      throw new Error('El tenant es requerido');
    }

    const roleData = {
      tenantId,
      name,
      description: description || undefined,
      isDefault: isDefault || false,
    };

    const response = await apiClient.post(
      '/core/roles-permissions/roles',
      roleData,
    );

    let createdRole;
    if (typeof response.data === 'string') {
      createdRole = { id: payload.id || '', tenantId, name, isDefault: false };
    } else {
      createdRole = roleSchema.parse(response.data);
    }

    if (permissionIds && permissionIds.length > 0) {
      await rolesService.assignPermissions(createdRole.id, permissionIds);
    }

    return createdRole;
  },

  update: async (payload: RoleMutation) => {
    if (!payload.id) {
      throw new Error('El id del rol es requerido para actualizar');
    }

    const { permissionIds, id, tenantId, name, description, isDefault } =
      payload;

    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(isDefault !== undefined && { isDefault }),
      ...(tenantId !== undefined && { tenantId }),
    };

    const response = await apiClient.patch(
      `/core/roles-permissions/roles/${id}`,
      updateData,
    );

    let updatedRole;
    if (typeof response.data === 'string') {
      updatedRole = {
        id,
        tenantId: tenantId || '',
        name: name || '',
        isDefault: false,
      };
    } else {
      updatedRole = roleSchema.parse(response.data);
    }

    if (permissionIds) {
      await rolesService.assignPermissions(id, permissionIds);
    }

    return updatedRole;
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(
      `/core/roles-permissions/roles/${id}`,
    );
    return roleDeleteResponseSchema.parse(response.data);
  },

  getPermissions: async () => {
    const response = await apiClient.get('/core/roles-permissions/permissions');
    return permissionsListResponseSchema.parse(response.data);
  },

  assignPermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await apiClient.post(
      `/core/roles-permissions/assignments/role/${roleId}`,
      { permissions: permissionIds },
    );
    if (typeof response.data === 'string') {
      return { message: 'Permissions assigned successfully' };
    }
    return assignPermissionsResponseSchema.parse(response.data);
  },

  getRolePermissions: async (roleId: string) => {
    const response = await apiClient.get(
      `/core/roles-permissions/assignments/role/${roleId}`,
    );
    return rolePermissionsResponseSchema.parse(response.data);
  },

  save: async (payload: RoleMutation) => {
    return payload.id
      ? rolesService.update(payload)
      : rolesService.create(payload);
  },
};
