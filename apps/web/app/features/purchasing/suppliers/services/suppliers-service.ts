import { apiClient } from '@/lib/api-client';
import {
  supplierDeleteResponseSchema,
  suppliersListResponseSchema,
} from '../schemas/suppliers-api.schema';
import {
  supplierSchema,
  type Supplier,
  type SupplierMutation,
} from '../schemas/suppliers.schema';

const PREFIX = '/purchasing/suppliers';

export interface SuppliersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tenantId?: string;
  state?: string;
  category?: string;
}

export interface SuppliersPaginatedResponse {
  data: Supplier[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

const buildQueryParams = (params: SuppliersQueryParams): string => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    ...(params.search ? { search: params.search } : {}),
    ...(params.tenantId ? { tenantId: params.tenantId } : {}),
    ...(params.state ? { state: params.state } : {}),
    ...(params.category ? { category: params.category } : {}),
  });

  return query.toString();
};

export const suppliersService = {
  getAll: async (
    params: SuppliersQueryParams,
  ): Promise<SuppliersPaginatedResponse> => {
    const response = await apiClient.get(
      `${PREFIX}/paginated?${buildQueryParams(params)}`,
    );

    try {
      const parsed = suppliersListResponseSchema.parse(response.data);
      return parsed;
    } catch {
      const data = supplierSchema.array().parse(response.data);
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

  getAllActive: async (): Promise<Supplier[]> => {
    const response = await apiClient.get(`${PREFIX}/all`);
    return supplierSchema.array().parse(response.data.data);
  },

  getById: async (id: string): Promise<Supplier> => {
    const response = await apiClient.get(`${PREFIX}/${id}`);
    return supplierSchema.parse(response.data);
  },

  create: async (payload: SupplierMutation): Promise<Supplier> => {
    const { id, ...createPayload } = payload;
    const response = await apiClient.post(PREFIX, createPayload);
    return supplierSchema.parse(response.data);
  },

  update: async (payload: SupplierMutation): Promise<Supplier> => {
    if (!payload.id) {
      throw new Error('El id del proveedor es requerido para actualizar');
    }

    const { id, ...updatePayload } = payload;
    const response = await apiClient.patch(`${PREFIX}/${id}`, updatePayload);
    return supplierSchema.parse(response.data);
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`${PREFIX}/${id}`);
    return supplierDeleteResponseSchema.parse(response.data);
  },

  save: async (payload: SupplierMutation): Promise<Supplier> => {
    return payload.id
      ? suppliersService.update(payload)
      : suppliersService.create(payload);
  },

  toggleStatus: async (id: string): Promise<Supplier> => {
    const response = await apiClient.patch(`${PREFIX}/${id}/toggle-status`);
    return supplierSchema.parse(response.data);
  },
};
