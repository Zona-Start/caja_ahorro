import { apiClient } from '@/lib/api-client';
import {
  AssociatesBulkUploadResponseSchema,
  AssociatesDeleteResponseSchema,
  AssociatesResponseAllSchema,
  AssociatesResponseOneSchema,
} from '../schemas/associates-response-api';
import { AssociatesMutate } from '../schemas/associates.schema';

export const associatesService = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    payroll?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    let searchType = '';
    let searchValue = '';

    if (params.search) {
      if (/^\d/.test(params.search)) {
        searchType = 'cedula';
      } else {
        searchType = 'fullname';
      }
      searchValue = params.search.toUpperCase();
    }

    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      ...(searchType && { searchType }),
      ...(searchValue && { search: searchValue }),
      ...(params.status && { status: params.status }),
      ...(params.payroll && { payroll: params.payroll }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    });

    const response = await apiClient.get(
      `/savings-banks/associates?${searchParams}`,
    );


    return AssociatesResponseAllSchema.parse(response.data);
  },

  getById: async (id: number | string) => {
    const response = await apiClient.get(`/savings-banks/associates/${id}`);
    return AssociatesResponseOneSchema.parse(response.data);
  },

  create: async (associatesMutate: AssociatesMutate) => {
    const { id, ...payloadWithoutId } = associatesMutate;
    const payload = {
      ...payloadWithoutId,
      birthdate: associatesMutate.birthdate.toISOString().split('T')[0],
      dateAdmission: associatesMutate.dateAdmission.toISOString().split('T')[0],
      dateGraduation: associatesMutate.dateGraduation
        ? associatesMutate.dateGraduation.toISOString().split('T')[0]
        : null,
      isPayrollCredit: Boolean(associatesMutate.isPayrollCredit),
      baseSalary: Number(associatesMutate.baseSalary),
    };

    const response = await apiClient.post('/savings-banks/associates', payload);
    console.log('Response create associate', response.data);

    return AssociatesResponseOneSchema.parse(response.data);
  },

  update: async (associatesMutate: AssociatesMutate) => {
    const { id, ...payloadWithoutId } = associatesMutate;
    const payload = {
      ...payloadWithoutId,
      birthdate: associatesMutate.birthdate.toISOString().split('T')[0],
      dateAdmission: associatesMutate.dateAdmission.toISOString().split('T')[0],
      dateGraduation: associatesMutate.dateGraduation
        ? associatesMutate.dateGraduation.toISOString().split('T')[0]
        : null,
      isPayrollCredit: Boolean(associatesMutate.isPayrollCredit),
      baseSalary: Number(associatesMutate.baseSalary),
    };

    const response = await apiClient.patch(
      `/savings-banks/associates/${id}`,
      payload,
    );
    return AssociatesResponseOneSchema.parse(response.data);
  },

  delete: async (id: number | string) => {
    const response = await apiClient.delete(`/savings-banks/associates/${id}`);
    return AssociatesDeleteResponseSchema.parse(response.data);
  },

  inactive: async (id: number | string) => {
    const response = await apiClient.delete(
      `/savings-banks/associates/${id}/inactive`,
    );
    return AssociatesDeleteResponseSchema.parse(response.data);
  },

  bulkUpload: async (formData: FormData) => {
    const response = await apiClient.post(
      '/savings-banks/associates/bulk-upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return AssociatesBulkUploadResponseSchema.parse(response.data);
  },

  downloadTemplate: async () => {
    const response = await apiClient.get(
      '/savings-banks/associates/bulk-upload/template',
      {
        responseType: 'arraybuffer',
      },
    );
    return response.data as ArrayBuffer;
  },

  exportPdf: async (params: any) => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.status) searchParams.append('status', params.status);
      if (params.payroll) searchParams.append('payroll', params.payroll);
      if (params.search) {
        const type = /^\d/.test(params.search) ? 'cedula' : 'fullname';
        searchParams.append('searchType', type);
        searchParams.append('search', params.search.toUpperCase());
      }
    }
    const response = await apiClient.get(
      `/savings-banks/associates/report/pdf?${searchParams}`,
      {
        responseType: 'arraybuffer',
      },
    );
    return response.data as ArrayBuffer;
  },
};
