import { apiClient } from '@/lib/api-client';
import {
  productApiResponseSchema,
  productDeleteResponseSchema,
  productListApiResponseSchema,
} from '../schemas/products-api.schema';
import type { Product } from '../schemas/products.schema';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
}

export interface PaginatedProductsResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean | null;
    hasPreviousPage: boolean | null;
    nextPage: number | null;
    previousPage: number | null;
  };
}

export class ProductsService {
  static async getAll() {
    const response = await apiClient.get('/inventory/products/all');
    return productListApiResponseSchema.parse(response.data).data;
  }

  static async getPaginated(
    params: ProductQueryParams,
  ): Promise<PaginatedProductsResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('limit', (params.limit || 10).toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.categoryId) searchParams.append('categoryId', params.categoryId);

    const response = await apiClient.get(
      `/inventory/products/paginated?${searchParams.toString()}`,
    );

    if (!response.data) {
      return {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPage: null,
          previousPage: null,
        },
      };
    }

    let parsed;
    try {
      parsed = productListApiResponseSchema.parse(response.data);
    } catch {
      return {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPage: null,
          previousPage: null,
        },
      };
    }

    return {
      data: parsed.data,
      meta: parsed.meta ?? {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: null,
        previousPage: null,
      },
    };
  }

  static async getById(id: string) {
    const response = await apiClient.get(`/inventory/products/${id}`);
    return productApiResponseSchema.parse(response.data).data;
  }

  static async create(payload: Product) {
    const { id, ...body } = payload;
    const response = await apiClient.post('/inventory/products', body);
    return productApiResponseSchema.parse(response.data).data;
  }

  static async update(payload: Product) {
    const { id, ...body } = payload;
    const response = await apiClient.patch(`/inventory/products/${id}`, body);
    return productApiResponseSchema.parse(response.data).data;
  }

  static async delete(id: string) {
    const response = await apiClient.delete(`/inventory/products/${id}`);
    return productDeleteResponseSchema.parse(response.data);
  }
}
