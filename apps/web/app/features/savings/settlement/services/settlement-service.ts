import { apiClient } from '@/lib/api-client';
import { type AssociatesSettlement, settlementAssociate } from '../schemas/individual-settlement-api-schema';
import { type SettlementPaymentApi, settlementApiSchema } from '../schemas/settlement-api-response';
import { type Settlement } from '../schemas/settlement.schema';

export const settlementService = {
  getAssociatesByCedula: async (cedula: string): Promise<AssociatesSettlement> => {
    const response = await apiClient.get(
      `/savings-banks/settlement-associate/request/${cedula}`,
    );
    const data = response.data?.data ?? response.data;
    return settlementAssociate.parse(data);
  },

  getSettlements: async (params: Record<string, unknown>) => {
    const searchParams = new URLSearchParams({
      page: String(params.page || 1),
      limit: String(params.limit || 10),
    });

    if (params.search) searchParams.set('search', String(params.search));

    const response = await apiClient.get(
      `/savings-banks/settlement-associate?${searchParams.toString()}`,
    );

    const raw = response.data;
    const data: SettlementPaymentApi[] = Array.isArray(raw.data)
      ? raw.data.map((item: unknown) => settlementApiSchema.parse(item))
      : [];

    return {
      data,
      meta: raw.meta ?? {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      },
    };
  },

  createSettlement: async (settlement: Settlement) => {
    const payload: Record<string, unknown> = {
      associateId: settlement.associateId,
      date: settlement.date,
      notes: settlement.notes ?? null,
    };
    if (settlement.hasBeneficiary && settlement.beneficiary) {
      payload.beneficiary = settlement.beneficiary;
    }

    const response = await apiClient.post(
      '/savings-banks/settlement-associate',
      payload,
    );
    return response.data;
  },

  approveSettlement: async (id: string) => {
    const response = await apiClient.post(
      `/savings-banks/settlement-associate/${id}/approve`,
    );
    return response.data;
  },

  disburseSettlement: async (
    id: string,
    formData: {
      bankAccountId: string;
      bankReference: string;
      transferDate: Date;
    },
  ) => {
    const response = await apiClient.post(
      `/savings-banks/settlement-associate/${id}/disburse`,
      formData,
    );
    return response.data;
  },
};
