import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

const typeLoanSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  interestRate: z.string(),
  administrativeExpensePercentage: z.string().nullable(),
  termUnits: z.number().nullable(),
  termType: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
});

const typeLoansResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(typeLoanSchema),
});

const typeLoanMutationSchema = z.object({
  message: z.string(),
  typeLoanId: z.number(),
});

export const typeLoansService = {
  getAll: async () => {
    const response = await apiClient.get('/loan-types');
    return typeLoansResponseSchema.parse(response.data);
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/loan-types/${id}`);
    return typeLoanSchema.parse(response.data);
  },

  create: async (typeLoan: unknown) => {
    const response = await apiClient.post('/loan-types', typeLoan);
    return typeLoanMutationSchema.parse(response.data);
  },

  update: async (id: number, typeLoan: unknown) => {
    const response = await apiClient.put(`/loan-types/${id}`, typeLoan);
    return typeLoanMutationSchema.parse(response.data);
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/loan-types/${id}`);
    return typeLoanMutationSchema.parse(response.data);
  },
};