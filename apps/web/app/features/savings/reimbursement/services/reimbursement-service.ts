import { apiClient } from '@/lib/api-client';

export interface ExcessItem {
  originType: 'LOAN' | 'CREDIT' | 'WITHDRAWAL';
  originId: string | null;
  originReference: string | null;
  originTypeName: string | null;
  amount: number;
}

export interface ExcessResponse {
  associate: {
    id: string;
    cedula: string;
    fullname: string;
    accountId: string | null;
    currencyCode: string | null;
  };
  items: ExcessItem[];
  total: number;
}

export interface ReimbursementListItem {
  id: string;
  customReference: string | null;
  associateId: string;
  associateCedula: string | null;
  associateFullname: string | null;
  destination: 'SAVINGS' | 'CASH';
  totalAmount: string;
  status: string;
  currencyCode: string;
  createdAt: string;
}

export interface CreateReimbursementPayload {
  cedula: string;
  destination: 'SAVINGS' | 'CASH';
  items: { originType: ExcessItem['originType']; originId?: string | null; originReference?: string | null; amount: number }[];
  bankId?: string | null;
  transactionReference?: string | null;
  paymentDate?: string | null;
  comment?: string | null;
}

export const reimbursementService = {
  getExcesses: async (cedula: string): Promise<ExcessResponse> => {
    const { data } = await apiClient.get(
      `/savings-banks/reimbursements/request/${cedula}`,
    );
    return data;
  },
  create: async (payload: CreateReimbursementPayload) => {
    const { data } = await apiClient.post(
      '/savings-banks/reimbursements',
      payload,
    );
    return data;
  },
  getAll: async (params: { page?: number; limit?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
    });
    const { data } = await apiClient.get(
      `/savings-banks/reimbursements?${query.toString()}`,
    );
    return data as { data: ReimbursementListItem[]; meta: Record<string, unknown> };
  },
  approve: async (id: string) => {
    const { data } = await apiClient.patch(
      `/savings-banks/reimbursements/${id}/approve`,
    );
    return data;
  },
  process: async (id: string) => {
    const { data } = await apiClient.patch(
      `/savings-banks/reimbursements/${id}/process`,
    );
    return data;
  },
  disburse: async (id: string, payload?: { bankId?: string; transactionReference?: string; paymentDate?: string }) => {
    const { data } = await apiClient.patch(
      `/savings-banks/reimbursements/${id}/disburse`,
      payload ?? {},
    );
    return data;
  },
  getBankAccounts: async (): Promise<
    { id: string; accountName: string | null; accountNumber: string; bankDirectoryName?: string }[]
  > => {
    const { data } = await apiClient.get(
      '/bakings/bank-accounts/paginated?page=1&limit=100&status=ACTIVE',
    );
    return data.data ?? data;
  },
};
