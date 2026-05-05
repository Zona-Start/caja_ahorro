import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

const creditPaidApiSchema = z.object({
  id: z.number(),
  creditId: z.number(),
  associateId: z.number(),
  amount: z.string(),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  reference: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
});

const creditsPaidResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(creditPaidApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

const creditPaidMutationSchema = z.object({
  message: z.string(),
  paymentId: z.number(),
});

export const creditsPaidService = {
  getCreditsPaid: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    creditId?: number;
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      ...(params.search && { search: params.search }),
      ...(params.creditId && { creditId: params.creditId.toString() }),
    });

    const response = await apiClient.get(`/credits-paid?${searchParams}`);
    return creditsPaidResponseSchema.parse(response.data);
  },

  getCreditPaidById: async (id: number) => {
    const response = await apiClient.get(`/credits-paid/${id}`);
    return creditPaidApiSchema.parse(response.data);
  },

  createCreditPayment: async (payment: unknown) => {
    const response = await apiClient.post('/credits-paid', payment);
    return creditPaidMutationSchema.parse(response.data);
  },
};