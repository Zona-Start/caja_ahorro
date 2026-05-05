import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

export const bankSchema = z.object({
  id: z.number().optional(),
  code: z.string(),
  name: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const banksListResponseSchema = z.object({
  message: z.string(),
  data: z.array(bankSchema),
});

export type Bank = z.infer<typeof bankSchema>;

export const banksService = {
  getAll: async () => {
    const response = await apiClient.get('/banks-directory');
    return banksListResponseSchema.parse(response.data);
  },
};
