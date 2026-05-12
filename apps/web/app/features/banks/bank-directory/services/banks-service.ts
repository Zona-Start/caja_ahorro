import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

export const bankSchema = z.object({
  id: z.string().optional(),
  countryCode: z.string(),
  code: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  updatedById: z.string(),
  createdById: z.string(),
});

export const banksListResponseSchema = z.object({
  message: z.string(),
  data: z.array(bankSchema),
});

export type Bank = z.infer<typeof bankSchema>;

export const banksService = {
  getAll: async () => {
    const response = await apiClient.get('/bakings/bank-directory');
    return banksListResponseSchema.parse(response.data);
  },
};
