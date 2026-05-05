import { apiClient } from '@/lib/api-client';
import { z } from 'zod';
import type { Settlement } from '../schemas/settlement.schema';
import type { DisburseSettlementFormData } from '../schemas/disburse-settlement.schema';

const settlementApiSchema = z.object({
  id: z.number().optional(),
  customReference: z.string(),
  liquidationDate: z.string(),
  totalSavingsBalanceAtLiquidation: z.string(),
  totalOutstandingLoansAtLiquidation: z.string(),
  totalOutstandingCreditsAtLiquidation: z.string(),
  netLiquidationAmount: z.string(),
  associateCedula: z.string(),
  associateFullname: z.string(),
  status: z.string(),
});

const settlementApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(settlementApiSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPage: z.number().nullable(),
    previousPage: z.number().nullable(),
  }).optional(),
});

const settlementAssociateSchema = z.object({
  associate_id: z.number(),
  fullname: z.string(),
  cedula: z.string(),
  admission_date: z.string(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  is_payroll_credit: z.boolean(),
  associate_account_id: z.number(),
  account_number: z.string(),
  currency_code: z.string(),
  total_savings_balance: z.string(),
  haberes_contribution: z.string(),
  haberes_voluntary: z.string(),
  haberes_employer: z.string(),
  surpluses: z.string(),
  total_withdrawals: z.string(),
  total_withdrawal_fees: z.string(),
  total_outstanding_loans: z.string(),
  total_outstanding_credits: z.string(),
  net_liquidation_amount: z.string(),
});

const associateLiquidationResponseSchema = z.object({
  message: z.string(),
  data: settlementAssociateSchema,
});

const settlementMutationSchema = z.object({
  message: z.string().optional(),
  liquidation: z.object({
    id: z.number(),
    customReference: z.string().nullable(),
  }),
});

const approveSettlementResponseSchema = z.object({
  message: z.string(),
  liquidationId: z.number(),
});

const disburseSettlementResponseSchema = z.object({
  message: z.string(),
  liquidationId: z.number(),
  bankTransactionId: z.number(),
});

export const settlementService = {
  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(
      `/savings-banks/settlement-associate/request/${cedula}`
    );
    const result = associateLiquidationResponseSchema.parse(response.data);
    return result.data;
  },

  getSettlements: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      ...(params.search && { search: params.search }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    });

    const response = await apiClient.get(
      `/savings-banks/settlement-associate?${searchParams}`
    );
    const result = settlementApiResponseSchema.parse(response.data);

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

  createSettlement: async (settlement: Settlement) => {
    const { id, ...payloadWithoutId } = settlement;
    const payload = {
      associateId: Number(payloadWithoutId.associateId),
      netLiquidationAmount: Number(payloadWithoutId.netLiquidationAmount),
      totalOutstandingCreditsAtLiquidation: Number(
        payloadWithoutId.totalOutstandingCreditsAtLiquidation
      ),
      totalOutstandingLoansAtLiquidation: Number(
        payloadWithoutId.totalOutstandingLoansAtLiquidation
      ),
      totalSavingsBalanceAtLiquidation: Number(
        payloadWithoutId.totalSavingsBalanceAtLiquidation
      ),
      liquidationDate: payloadWithoutId.liquidationDate
        .toISOString()
        .split('T')[0],
      notes: payloadWithoutId.notes,
      paymentMethod: payloadWithoutId.paymentMethod,
      beneficiary: payloadWithoutId.beneficiary,
    };

    const response = await apiClient.post(
      '/savings-banks/settlement-associate/request',
      payload
    );
    return settlementMutationSchema.parse(response.data);
  },

  approveSettlement: async (id: number) => {
    const response = await apiClient.post(
      `/savings-banks/settlement-associate/${id}/approve`
    );
    return approveSettlementResponseSchema.parse(response.data);
  },

  saveSettlement: async (settlement: Settlement) => {
    return await settlementService.createSettlement(settlement);
  },

  disburseSettlement: async (id: number, formData: DisburseSettlementFormData) => {
    const response = await apiClient.post(
      `/savings-banks/settlement-associate/${id}/disburse`,
      formData
    );
    return disburseSettlementResponseSchema.parse(response.data);
  },
};