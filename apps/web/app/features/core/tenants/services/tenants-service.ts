import { apiClient } from '@/lib/api-client';
import {
  tenantByRifResponseSchema,
  tenantCountResponseSchema,
  tenantDeleteResponseSchema,
  tenantsListResponseSchema,
} from '../schemas/tenants-api.schema';
import { tenantSchema, type Tenant, type TenantMutation } from '../schemas/tenants.schema';

export interface TenantsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  businessType?: string;
}

export interface TenantsPaginatedResponse {
  data: Tenant[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

const buildQueryParams = (params: TenantsQueryParams): string => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    ...(params.search ? { search: params.search } : {}),
    ...(params.isActive !== undefined
      ? { isActive: String(params.isActive) }
      : {}),
    ...(params.businessType ? { businessType: params.businessType } : {}),
  });

  return query.toString();
};

export const tenantsService = {
  getAll: async (params: TenantsQueryParams): Promise<TenantsPaginatedResponse> => {
    const response = await apiClient.get(
      `/core/tenants?${buildQueryParams(params)}`,
    );

    try {
      const parsed = tenantsListResponseSchema.parse(response.data);
      return parsed;
    } catch {
      const data = tenantSchema.array().parse(response.data);
      return {
        data,
        meta: {
          totalItems: data.length,
          itemCount: data.length,
          itemsPerPage: params.limit ?? 10,
          totalPages: Math.ceil(data.length / (params.limit ?? 10)),
          currentPage: params.page ?? 1,
        },
      };
    }
  },

  getActiveCount: async () => {
    const response = await apiClient.get('/core/tenants/count');
    return tenantCountResponseSchema.parse(response.data).count;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/core/tenants/${id}`);
    return tenantSchema.parse(response.data);
  },

  getByRif: async (rif: string) => {
    const response = await apiClient.get(`/core/tenants/rif/${rif}`);
    return tenantByRifResponseSchema.parse(response.data);
  },

  create: async (payload: TenantMutation) => {
    const { id, isActive, ...createPayload } = payload;
    const response = await apiClient.post('/core/tenants', createPayload);
    return tenantSchema.parse(response.data);
  },

  update: async (payload: TenantMutation) => {
    if (!payload.id) {
      throw new Error('El id del tenant es requerido para actualizar');
    }

    const { id, ...updatePayload } = payload;
    const response = await apiClient.patch(`/core/tenants/${id}`, updatePayload);
    return tenantSchema.parse(response.data);
  },

  remove: async (id: string) => {
    const response = await apiClient.delete(`/core/tenants/${id}`);
    return tenantDeleteResponseSchema.parse(response.data);
  },

  save: async (payload: TenantMutation) => {
    return payload.id
      ? tenantsService.update(payload)
      : tenantsService.create(payload);
  },

  enableModule: async (tenantId: string, moduleCode: string) => {
    const response = await apiClient.post(`/core/tenants/${tenantId}/modules`, {
      moduleCode,
      status: 'ENABLED',
    });
    return response.data;
  },

  enableModules: async (tenantId: string, moduleCodes: string[]) => {
    const results = await Promise.all(
      moduleCodes.map((code) => tenantsService.enableModule(tenantId, code)),
    );
    return results;
  },

  getModules: async (tenantId: string) => {
    const response = await apiClient.get(`/core/tenants/${tenantId}/modules`);
    return response.data as Array<{ id: string; moduleCode: string; status: string }>;
  },
};

