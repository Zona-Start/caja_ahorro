import { apiClient } from '@/lib/api-client';
import type {
  ExpenseReportForm,
  ExpenseReportItem,
  PayReportForm,
} from '../schemas/expense-reports.schema';

const BASE_URL = '/expense-reports';

export interface ExpenseReportsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  employeeUserId?: string;
  search?: string;
}

export const expenseReportsService = {
  getAllPaginated: async (params: ExpenseReportsQueryParams) => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.status) query.set('status', params.status);
    if (params.employeeUserId)
      query.set('employeeUserId', params.employeeUserId);
    if (params.search) query.set('search', params.search);
    const response = await apiClient.get(
      `${BASE_URL}/paginated?${query.toString()}`,
    );
    return response.data as {
      data: Array<Record<string, unknown> & { id: string }>;
      meta: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
      };
    };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data as {
      data: ExpenseReportItem & { id: string; title: string };
    };
  },

  create: async (payload: ExpenseReportForm) => {
    const response = await apiClient.post(BASE_URL, {
      ...payload,
      employeeUserId: payload.employeeUserId || undefined,
    });
    return response.data;
  },

  approve: async (id: string) => {
    const response = await apiClient.patch(`${BASE_URL}/approve/${id}`);
    return response.data;
  },

  reject: async (id: string, reason?: string) => {
    const response = await apiClient.patch(`${BASE_URL}/reject/${id}`, {
      reason: reason ?? null,
    });
    return response.data;
  },

  pay: async (id: string, payload: PayReportForm) => {
    const response = await apiClient.patch(`${BASE_URL}/pay/${id}`, {
      paymentSource: payload.paymentSource,
      bankAccountId: payload.bankAccountId || undefined,
      pettyCashFundId: payload.pettyCashFundId || undefined,
    });
    return response.data;
  },
};
