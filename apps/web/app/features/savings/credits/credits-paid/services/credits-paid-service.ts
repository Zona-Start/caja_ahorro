import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

const creditPaidApiSchema = z.object({
  id: z.number(),
  creditId: z.number(),
  associateId: z.number(),
  amount: z.string(),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  reference: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
});

const creditsPaidResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(creditPaidApiSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});

const creditPaidMutationSchema = z.object({
  message: z.string(),
  paymentId: z.number(),
});

const deleteCreditPaymentSchema = z.object({
  message: z.string(),
});

const associateCreditApiSchema = z.object({
  message: z.string(),
  data: z.object({
    associate: z.object({
      associateId: z.number(),
      fullname: z.string(),
      cedula: z.string(),
      accountNumber: z.string(),
      balance: z.string(),
      isPayrollCredit: z.boolean(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
      dateAdmission: z.string().nullable(),
    }),
    creditId: z.number(),
    creditTypeId: z.number(),
    creditModality: z.string(),
    requestedAmount: z.string(),
    approvedAmount: z.string(),
    interestRate: z.string(),
    termMonths: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    status: z.string(),
    outstandingBalance: z.string(),
    totalPaid: z.string(),
    nextPaymentDate: z.string().nullable(),
    installmentAmount: z.string(),
    installmentsCount: z.number(),
    installmentsPaid: z.number(),
    installmentsPending: z.number(),
    creditCustomReference: z.string().nullable(),
    creditTypeName: z.string().nullable(),
    quotas: z
      .array(
        z.object({
          quotaNumber: z.number(),
          dueDate: z.string(),
          amount: z.string(),
          principal: z.string(),
          interest: z.string(),
          balance: z.string(),
          status: z.string(),
        }),
      )
      .nullable(),
    totalCredits: z.number().optional(),
    totalLoans: z.number().optional(),
  }),
});

export const creditsPaidService = {
  getCreditsPaid: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    creditId?: number;
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      ...(params.search && { search: params.search }),
      ...(params.creditId && { creditId: params.creditId.toString() }),
    });

    const response = await apiClient.get(`/credits-paid?${searchParams}`);
    return creditsPaidResponseSchema.parse(response.data);
  },

  getCreditPaidById: async (id: number) => {
    const response = await apiClient.get(`/credits-paid/${id}`);
    return creditPaidApiSchema.parse(response.data);
  },

  createCreditPayment: async (payment: unknown) => {
    const response = await apiClient.post('/credits-paid', payment);
    return creditPaidMutationSchema.parse(response.data);
  },

  deleteCreditPayment: async (id: number) => {
    const response = await apiClient.delete(`/credits-paid/${id}`);
    return deleteCreditPaymentSchema.parse(response.data);
  },

  getAssociatesByCedula: async (cedula: string) => {
    const response = await apiClient.get(`/credits-paid/associate/${cedula}`);
    const result = associateCreditApiSchema.parse(response.data);
    return result.data;
  },
};