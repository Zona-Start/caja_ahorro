import { apiClient } from '@/lib/api-client';
import {
  type ExecuteSpecialOperationPayload,
  type ExecuteSpecialOperationResponse,
  type PreviewResponse,
  type SpecialOperationAccountConfigItem,
  previewResponseSchema,
  type SpecialOperationListItem,
  type SpecialOperationType,
} from '../schemas/special-operations.schema';

export type AccountPlanOption = {
  id: string;
  code: string;
  name: string;
  accountType: string;
  nature: string;
  allowsMovements: boolean;
  isActive: boolean;
};

export const specialOperationsService = {
  downloadTemplate: async (): Promise<string> => {
    const response = await apiClient.get(
      '/savings-banks/special-operations/template',
      { responseType: 'arraybuffer' },
    );

    const bytes = new Uint8Array(response.data as ArrayBuffer);
    let binary = '';
    for (let index = 0; index < bytes.length; index++) {
      binary += String.fromCharCode(bytes[index]!);
    }
    return btoa(binary);
  },

  preview: async (
    file: File,
    operationType: SpecialOperationType,
    operationDate: string,
  ): Promise<PreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operationType', operationType);
    formData.append('operationDate', operationDate);

    const response = await apiClient.post(
      '/savings-banks/special-operations/preview',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return previewResponseSchema.parse(response.data);
  },

  getConfig: async (
    operationType: SpecialOperationType,
  ): Promise<{ details: SpecialOperationAccountConfigItem[] }> => {
    const response = await apiClient.get(
      `/savings-banks/special-operations/account-config/${operationType}`,
    );
    return response.data;
  },

  saveConfig: async (
    operationType: SpecialOperationType,
    details: SpecialOperationAccountConfigItem[],
  ) => {
    const response = await apiClient.put(
      `/savings-banks/special-operations/account-config/${operationType}`,
      { details },
    );
    return response.data;
  },

  execute: async (
    payload: ExecuteSpecialOperationPayload,
  ): Promise<ExecuteSpecialOperationResponse> => {
    const response = await apiClient.post(
      '/savings-banks/special-operations/execute',
      payload,
    );
    return response.data;
  },

  getOperations: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    operationType?: string;
  }): Promise<{
    data: SpecialOperationListItem[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> => {
    const response = await apiClient.get(
      '/savings-banks/special-operations',
      { params },
    );
    return response.data;
  },

  getOperation: async (id: string) => {
    const response = await apiClient.get(
      `/savings-banks/special-operations/${id}`,
    );
    return response.data;
  },

  getAccounts: async (): Promise<AccountPlanOption[]> => {
    const response = await apiClient.get(
      '/savings-banks/special-operations/accounts',
    );
    const data = response.data?.data ?? response.data ?? [];
    return Array.isArray(data) ? data : [];
  },
};
