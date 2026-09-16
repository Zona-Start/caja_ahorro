import { apiClient } from '@/lib/api-client';
import type {
  CloseSettlementForm,
  LiquidateVoucherForm,
  OpenSettlementForm,
  RealizeSettlementForm,
  Settlement,
  SettlementPreview,
  Voucher,
  VoucherForm,
} from '../schemas/petty-cash-operations.schema';

const VOUCHERS_URL = '/petty-cash-vouchers';
const SETTLEMENTS_URL = '/petty-cash-settlements';

export interface VouchersQueryParams {
  page?: number;
  limit?: number;
  fundId?: string;
  status?: string;
  search?: string;
}

export interface SettlementsQueryParams {
  page?: number;
  limit?: number;
  fundId?: string;
  period?: string;
}

const createVoucherBody = (payload: VoucherForm) => ({
  fundId: payload.fundId,
  beneficiaryName: payload.beneficiaryName,
  amount: payload.amount,
  concept: payload.concept,
  ticketImageUrl: payload.ticketImageUrl || undefined,
});

export const pettyCashVouchersService = {
  getAllPaginated: async (params: VouchersQueryParams) => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.fundId) query.set('fundId', params.fundId);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    const response = await apiClient.get(
      `${VOUCHERS_URL}/paginated?${query.toString()}`,
    );
    return response.data as {
      data: Voucher[];
      meta: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
      };
    };
  },

  create: async (payload: VoucherForm) => {
    const response = await apiClient.post(
      VOUCHERS_URL,
      createVoucherBody(payload),
    );
    return response.data;
  },

  liquidate: async (id: string, payload: LiquidateVoucherForm) => {
    const response = await apiClient.patch(
      `${VOUCHERS_URL}/liquidate/${id}`,
      payload,
    );
    return response.data;
  },

  void: async (id: string) => {
    const response = await apiClient.delete(`${VOUCHERS_URL}/${id}`);
    return response.data;
  },
};

export const pettyCashSettlementsService = {
  getAllPaginated: async (params: SettlementsQueryParams) => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.fundId) query.set('fundId', params.fundId);
    if (params.period) query.set('period', params.period);
    const response = await apiClient.get(
      `${SETTLEMENTS_URL}/paginated?${query.toString()}`,
    );
    return response.data as {
      data: Settlement[];
      meta: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
      };
    };
  },

  open: async (payload: OpenSettlementForm) => {
    const response = await apiClient.post(SETTLEMENTS_URL, payload);
    return response.data;
  },

  preview: async (fundId: string, period?: string) => {
    const query = new URLSearchParams();
    query.set('fundId', fundId);
    if (period) query.set('period', period);
    const response = await apiClient.get(
      `${SETTLEMENTS_URL}/preview?${query.toString()}`,
    );
    return response.data as { data: SettlementPreview };
  },

  realize: async (payload: RealizeSettlementForm) => {
    const response = await apiClient.post(
      `${SETTLEMENTS_URL}/realize`,
      payload,
    );
    return response.data;
  },

  replenish: async (id: string) => {
    const response = await apiClient.post(`${SETTLEMENTS_URL}/${id}/replenish`);
    return response.data;
  },

  payReplenishment: async (id: string) => {
    const response = await apiClient.patch(
      `${SETTLEMENTS_URL}/${id}/replenish/pay`,
    );
    return response.data;
  },

  refresh: async (id: string) => {
    const response = await apiClient.get(`${SETTLEMENTS_URL}/${id}/refresh`);
    return response.data;
  },

  close: async (id: string, payload: CloseSettlementForm) => {
    const response = await apiClient.patch(
      `${SETTLEMENTS_URL}/close/${id}`,
      payload,
    );
    return response.data;
  },
};
