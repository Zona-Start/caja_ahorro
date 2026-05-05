import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

const creditAssociateGetResponseSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  creditTypeId: z.number(),
  creditModality: z.string(),
  requestDate: z.string(),
  requestedAmount: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  expensesAmount: z.string().nullable(),
  overdraftAmount: z.string().nullable(),
  termMonths: z.string().nullable(),
  interestRate: z.string().nullable(),
  installmentsCount: z.number().nullable(),
  status: z.string(),
  notes: z.string().nullable(),
  customReference: z.string().nullable(),
  creditTypeName: z.string().nullable(),
  associateCedula: z.string().nullable(),
  associateFullname: z.string().nullable(),
  associatePhone: z.string().nullable(),
  associateEmail: z.string().nullable(),
  associateDateAdmission: z.string().nullable(),
  associateIsPayrollCredit: z.boolean().nullable(),
  associateAccountId: z.number().nullable(),
  associateAccountNumber: z.string().nullable(),
  associateBalance: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
});

const creditManagementResponseSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  creditTypeId: z.number(),
  creditModality: z.string(),
  requestDate: z.string(),
  requestedAmount: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  expensesAmount: z.string().nullable(),
  overdraftAmount: z.string().nullable(),
  termMonths: z.string().nullable(),
  interestRate: z.string().nullable(),
  installmentsCount: z.number().nullable(),
  status: z.string(),
  notes: z.string().nullable(),
  customReference: z.string().nullable(),
  creditTypeName: z.string().nullable(),
  associateCedula: z.string().nullable(),
  associateFullname: z.string().nullable(),
  creditTypeInterestRate: z.string().nullable(),
  creditTypeAdministrativeExpensePercentage: z.string().nullable(),
  creditTypeTermUnits: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  termType: z.string().nullable(),
  termUnits: z.number().nullable(),
});

const creditManagementResponseAllSchema = z.object({
  message: z.string().optional(),
  data: z.array(creditManagementResponseSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});

const creditManagementMutationSchema = z.object({
  message: z.string(),
  creditId: z.number(),
});

const creditManagementAllCountSchema = z.object({
  total: z.number(),
  pending: z.number(),
  approved: z.number(),
  rejected: z.number(),
  disbursed: z.number(),
});

const loadAssociateApiResponseSchema = z.object({
  message: z.string(),
  data: creditAssociateGetResponseSchema,
});

const creditDeleteResponseSchema = z.object({
  message: z.string(),
});

export const creditManagementService = {
  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(`/credit/request/${cedula}`);
    const result = loadAssociateApiResponseSchema.parse(response.data);
    return result.data;
  },

  getCreditManagementById: async (id: number) => {
    const response = await apiClient.get(`/credit/request/byEdit/${id}`);
    const data = creditAssociateGetResponseSchema.parse(response.data);

    return {
      id: String(data.id),
      associateId: Number(data.associateId),
      creditTypeId: String(data.creditTypeId),
      creditModality: data.creditModality,
      requestDate: data.requestDate ? new Date(data.requestDate) : new Date(),
      requestedAmount: data.requestedAmount ?? '',
      startDate: data.startDate,
      endDate: data.endDate,
      expensesAmount: data.expensesAmount,
      overdraftAmount: data.overdraftAmount ?? '',
      termMonths: data.expensesAmount ?? '',
      interestRate: data.interestRate ?? '',
      installmentsCount: data.expensesAmount ?? '',
      status: data.status ?? '',
      notes: data.notes,
      customReference: data.customReference,
      creditTypeName: data.creditTypeName,
      associateCedula: data.associateCedula,
      associateFullname: data.associateFullname,
      associatePhone: data.associatePhone,
      associateEmail: data.associateEmail,
      associateDateAdmission: data.associateDateAdmission,
      associateIsPayrollCredit: data.associateIsPayrollCredit,
      associateAccountId: data.associateAccountId,
      associateAccountNumber: data.associateAccountNumber,
      associateBalance: data.associateBalance,
      invoiceNumber: data.invoiceNumber,
    };
  },

  getCreditManagementAll: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    modality?: string;
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
      ...(params.type && { type: params.type }),
      ...(params.modality && { modality: params.modality }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    });

    const response = await apiClient.get(`/credit?${searchParams}`);
    const result = creditManagementResponseAllSchema.parse(response.data);

    return {
      data: result.data || [],
      meta: result.meta || {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: null,
        previousPage: null,
      },
    };
  },

  createCreditManagement: async (creditManagement: unknown) => {
    const response = await apiClient.post('/credit/request', creditManagement);
    return creditManagementMutationSchema.parse(response.data);
  },

  approveCreditManagement: async (id: number) => {
    const response = await apiClient.patch(`/credit/approve/${id}`);
    return creditManagementMutationSchema.parse(response.data);
  },

  deleteCreditManagement: async (id: number) => {
    const response = await apiClient.delete(`/credit/${id}`);
    return creditDeleteResponseSchema.parse(response.data);
  },

  getCreditManagementAllCount: async () => {
    const response = await apiClient.get('/credit/count');
    return creditManagementAllCountSchema.parse(response.data);
  },
};