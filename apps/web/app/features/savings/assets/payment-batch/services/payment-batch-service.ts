import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

const paymentBatchApiSchema = z.object({
  id: z.number(),
  customReference: z.string().nullable(),
  bankAccountId: z.number(),
  currencyCode: z.string(),
  totalAmount: z.string(),
  status: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(z.unknown()).optional(),
});

const paymentBatchApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(paymentBatchApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});

const paymentBatchMutationSchema = z.object({
  message: z.string(),
  paymentBatchId: z.number(),
});

const approvedSourceItemsApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(z.unknown()),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }).optional(),
});

export type PaymentBatch = z.infer<typeof paymentBatchApiSchema>;

export const paymentBatchService = {
  getPaymentBatches: async (filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams({
      page: (filters.page || 1).toString(),
      limit: (filters.limit || 10).toString(),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
    });

    const response = await apiClient.get(
      `/savings-banks/payment-batches?${searchParams}`
    );
    const result = paymentBatchApiResponseSchema.parse(response.data);

    return {
      data: result.data || [],
      meta: result.meta || {
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
  },

  getPaymentBatchDetails: async (id: number) => {
    const response = await apiClient.get(`/savings-banks/payment-batches/${id}`);
    return paymentBatchApiSchema.parse(response.data);
  },

  createPaymentBatch: async (dto: unknown) => {
    const response = await apiClient.post('/savings-banks/payment-batches', dto);
    return paymentBatchMutationSchema.parse(response.data);
  },

  markAsUploaded: async (id: number) => {
    const response = await apiClient.patch(
      `/savings-banks/payment-batches/${id}/uploaded`
    );
    return paymentBatchMutationSchema.parse(response.data);
  },

  confirmPaymentBatch: async (id: number, dto: unknown) => {
    const response = await apiClient.patch(
      `/savings-banks/payment-batches/${id}/confirm`,
      dto
    );
    return paymentBatchMutationSchema.parse(response.data);
  },

  cancelPaymentBatch: async (id: number) => {
    const response = await apiClient.patch(
      `/savings-banks/payment-batches/${id}/cancel`
    );
    return paymentBatchMutationSchema.parse(response.data);
  },

  downloadTxtFile: async (id: number) => {
    const response = await apiClient.get(`/savings-banks/payment-batches/${id}/txt`, {
      responseType: 'text',
    });
    return {
      fileName: `pagos-por-lote-${id}.txt`,
      content: response.data as string,
    };
  },

  getApprovedLoans: async () => {
    const response = await apiClient.get('/loan/approved');
    const result = approvedSourceItemsApiResponseSchema.parse(response.data);
    return result.data;
  },

  getApprovedWithdrawals: async (page = 1, limit = 20) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await apiClient.get(
      `/savings-banks/withdrawal-associate/approved?${searchParams}`
    );
    return approvedSourceItemsApiResponseSchema.parse(response.data);
  },

  getApprovedLiquidations: async (page = 1, limit = 20) => {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await apiClient.get(
      `/savings-banks/settlement-associate/approved?${searchParams}`
    );
    return approvedSourceItemsApiResponseSchema.parse(response.data);
  },
};