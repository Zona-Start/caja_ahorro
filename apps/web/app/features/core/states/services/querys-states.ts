import { apiClient } from '@/lib/api-client';
import { statesSchema } from '../schemas/states-schemas';

export const getStatesAction = async () => {
  const response = await apiClient.get(`/core/states`);
  return statesSchema.parse(response.data);
};
