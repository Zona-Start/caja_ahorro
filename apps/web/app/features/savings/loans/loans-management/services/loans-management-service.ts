import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

const loanAssociateGetResponseSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  loanTypeId: z.number(),
  loanModality: z.string(),
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
  loanTypeName: z.string().nullable(),
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

const loanManagementResponseSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  loanTypeId: z.number(),
  loanModality: z.string(),
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
  loanTypeName: z.string().nullable(),
  associateCedula: z.string().nullable(),
  associateFullname: z.string().nullable(),
  loanTypeInterestRate: z.string().nullable(),
  loanTypeAdministrativeExpensePercentage: z.string().nullable(),
  loanTypeTermUnits: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  termType: z.string().nullable(),
  termUnits: z.number().nullable(),
});

const loansManagementResponseAllSchema = z.object({
  message: z.string().optional(),
  data: z.array(loanManagementResponseSchema),
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

const loansManagementMutationSchema = z.object({
  message: z.string(),
  loanId: z.number(),
});

const loansManagementAllCountSchema = z.object({
  total: z.number(),
  pending: z.number(),
  approved: z.number(),
  rejected: z.number(),
  disbursed: z.number(),
});

const loadAssociateApiResponseSchema = z.object({
  message: z.string(),
  data: loanAssociateGetResponseSchema,
});

const loanDeleteResponseSchema = z.object({
  message: z.string(),
});

export const loansManagementService = {
  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(`/loan/request/${cedula}`);
    const result = loadAssociateApiResponseSchema.parse(response.data);
    return result.data;
  },

  getLoansManagementById: async (id: number) => {
    const response = await apiClient.get(`/loan/request/byEdit/${id}`);
    const data = loanAssociateGetResponseSchema.parse(response.data);

    return {
      id: String(data.id),
      associateId: Number(data.associateId),
      loanTypeId: String(data.loanTypeId),
      loanModality: data.loanModality,
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
      loanTypeName: data.loanTypeName,
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

  getLoansManagementAll: async (params: {
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

    const response = await apiClient.get(`/loan?${searchParams}`);
    const result = loansManagementResponseAllSchema.parse(response.data);

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

  createLoansManagement: async (loansManagement: unknown) => {
    const response = await apiClient.post('/loan/request', loansManagement);
    return loansManagementMutationSchema.parse(response.data);
  },

  approveLoansManagement: async (id: number) => {
    const response = await apiClient.patch(`/loan/approve/${id}`);
    return loansManagementMutationSchema.parse(response.data);
  },

  deleteLoansManagement: async (id: number) => {
    const response = await apiClient.delete(`/loan/${id}`);
    return loanDeleteResponseSchema.parse(response.data);
  },

  getLoansManagementAllCount: async () => {
    const response = await apiClient.get('/loan/count');
    return loansManagementAllCountSchema.parse(response.data);
  },
};