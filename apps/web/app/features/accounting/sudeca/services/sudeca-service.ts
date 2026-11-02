import { apiClient } from '@/lib/api-client';
import {
  sudecaResponseSchema,
  type SudecaReportType,
  type SudecaResponse,
} from '../schemas/sudeca.schema';

export const sudecaService = {
  getData: async (
    type: SudecaReportType,
    params: { accountingCycleId: string; quarter: number },
  ): Promise<SudecaResponse> => {
    const response = await apiClient.get(`/accounting-reports/sudeca/${type}`, {
      params,
    });
    return sudecaResponseSchema.parse(response.data);
  },
};
