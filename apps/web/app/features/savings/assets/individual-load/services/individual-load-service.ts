import { apiClient } from '@/lib/api-client';
import { loadAssestApiResponseSchema } from '../schemas/individual-load-api-schema';
import type { LoadAssest } from '../schemas/individual-load-schema';

export const individualLoadService = {
  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(
      `/savings-banks/associates/cedula/${cedula}`
    );
    return response.data;
  },

  saveIndividualLoad: async (payload: LoadAssest) => {
    const { includeBankingDetails, ...rest } = payload;
    const response = await apiClient.post(
      '/savings-banks/individual-load',
      rest
    );
    const result = loadAssestApiResponseSchema.parse(response.data);
    return result?.message;
  },

  downloadTemplate: async (): Promise<string> => {
    const response = await apiClient.get(
      '/savings-banks/individual-load/template-bulk',
      {
        responseType: 'arraybuffer',
      }
    );
    const buffer = Buffer.from(response.data, 'binary');
    return buffer.toString('base64');
  },

  bulkUpload: async (formData: FormData) => {
    const response = await apiClient.post(
      '/savings-banks/individual-load/bulk',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};