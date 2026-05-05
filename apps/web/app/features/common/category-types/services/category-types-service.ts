import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

export const categoryTypeSchema = z.object({
  id: z.number().optional(),
  code: z.string(),
  description: z.string(),
  group: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const categoryTypesListResponseSchema = z.object({
  message: z.string(),
  data: z.array(categoryTypeSchema),
});

export type CategoryType = z.infer<typeof categoryTypeSchema>;

export const categoryTypesService = {
  getByGroup: async (group: string) => {
    const response = await apiClient.get(`/core/category-types/group/${group}`);
    return categoryTypesListResponseSchema.parse(response.data);
  },
};
