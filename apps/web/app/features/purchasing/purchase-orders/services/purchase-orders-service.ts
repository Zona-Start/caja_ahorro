import { apiClient } from '@/lib/api-client';
import {
  purchaseOrderListResponseSchema,
  purchaseOrderSingleResponseSchema,
  purchaseOrderMutationResponseSchema,
  purchaseOrderForInvoiceListResponseSchema,
} from '../schemas/purchase-orders-api.schema';
import type { PurchaseOrderForInvoiceApi } from '../schemas/purchase-orders-api.schema';
import type { PurchaseOrder } from '../schemas/purchase-orders.schema';

export interface PurchaseOrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedPurchaseOrdersResponse {
  data: PurchaseOrder[];
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

const emptyMeta = {
  page: 1,
  limit: 10,
  totalCount: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
};

export const purchaseOrdersService = {
  getPaginated: async (
    params: PurchaseOrderQueryParams,
  ): Promise<PaginatedPurchaseOrdersResponse> => {
    const searchParams = new URLSearchParams();
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('limit', (params.limit || 10).toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);

    const response = await apiClient.get(
      `/administration/purchase-orders/paginated?${searchParams.toString()}`,
    );

    if (!response.data) {
      return { data: [], meta: emptyMeta };
    }

    try {
      const parsed = purchaseOrderListResponseSchema.parse(response.data);
      const meta = parsed.meta ?? emptyMeta;
      return {
        data: parsed.data as unknown as PurchaseOrder[],
        meta: meta as PaginatedPurchaseOrdersResponse['meta'],
      };
    } catch {
      return { data: [], meta: emptyMeta };
    }
  },

  getById: async (id: number): Promise<PurchaseOrder> => {
    const response = await apiClient.get(
      `/administration/purchase-orders/${id}`,
    );
    const parsed = purchaseOrderSingleResponseSchema.parse(response.data);
    return parsed.data as unknown as PurchaseOrder;
  },

  getForInvoice: async (
    supplierId: number,
  ): Promise<PurchaseOrderForInvoiceApi[]> => {
    const response = await apiClient.get(
      `/administration/purchase-orders/for-invoice?supplierId=${supplierId}`,
    );
    const parsed =
      purchaseOrderForInvoiceListResponseSchema.parse(response.data);
    return parsed.data;
  },

  create: async (payload: PurchaseOrder): Promise<PurchaseOrder> => {
    const { id, ...body } = payload;
    const response = await apiClient.post(
      '/administration/purchase-orders',
      body,
    );
    const parsed = purchaseOrderMutationResponseSchema.parse(response.data);
    return parsed.data as unknown as PurchaseOrder;
  },

  update: async (payload: PurchaseOrder): Promise<PurchaseOrder> => {
    const { id, ...body } = payload;
    const response = await apiClient.patch(
      `/administration/purchase-orders/${id}`,
      body,
    );
    const parsed = purchaseOrderMutationResponseSchema.parse(response.data);
    return parsed.data as unknown as PurchaseOrder;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/administration/purchase-orders/${id}`);
  },
};
