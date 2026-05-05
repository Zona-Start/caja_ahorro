import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

export const stateSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type State = z.infer<typeof stateSchema>;

export const statesService = {
  getAll: async () => {
    const response = await apiClient.get('/core/states');
    return z.array(stateSchema).parse(response.data);
  },
};
