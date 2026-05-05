import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

const typeCreditSchema = z.object({
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

const typeCreditsResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(typeCreditSchema),
});

const typeCreditMutationSchema = z.object({
  message: z.string(),
  typeCreditId: z.number(),
});

export const typeCreditsService = {
  getAll: async () => {
    const response = await apiClient.get('/credit-types');
    return typeCreditsResponseSchema.parse(response.data);
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/credit-types/${id}`);
    return typeCreditSchema.parse(response.data);
  },

  create: async (typeCredit: unknown) => {
    const response = await apiClient.post('/credit-types', typeCredit);
    return typeCreditMutationSchema.parse(response.data);
  },

  update: async (id: number, typeCredit: unknown) => {
    const response = await apiClient.put(`/credit-types/${id}`, typeCredit);
    return typeCreditMutationSchema.parse(response.data);
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/credit-types/${id}`);
    return typeCreditMutationSchema.parse(response.data);
  },
};