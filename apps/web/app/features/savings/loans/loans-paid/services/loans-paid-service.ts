import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

const loanPaidApiSchema = z.object({
  id: z.number(),
  loanId: z.number(),
  associateId: z.number(),
  amount: z.string(),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  reference: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
});

const loansPaidResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(loanPaidApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

const loanPaidMutationSchema = z.object({
  message: z.string(),
  paymentId: z.number(),
});

export const loansPaidService = {
  getLoansPaid: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    loanId?: number;
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      ...(params.search && { search: params.search }),
      ...(params.loanId && { loanId: params.loanId.toString() }),
    });

    const response = await apiClient.get(`/loans-paid?${searchParams}`);
    return loansPaidResponseSchema.parse(response.data);
  },

  getLoanPaidById: async (id: number) => {
    const response = await apiClient.get(`/loans-paid/${id}`);
    return loanPaidApiSchema.parse(response.data);
  },

  createLoanPayment: async (payment: unknown) => {
    const response = await apiClient.post('/loans-paid', payment);
    return loanPaidMutationSchema.parse(response.data);
  },
};