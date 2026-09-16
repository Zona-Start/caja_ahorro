import { apiClient } from '@/lib/api-client';
import { z } from 'zod';
import {
  customerSchema,
  customerPaymentSchema,
  deliveryNoteSchema,
  posProductSchema,
  receivableSchema,
  saleInvoiceSchema,
  type Customer,
  type CustomerPayload,
  type DeliveryNote,
  type PaginatedMeta,
  type PaginatedResult,
  type PosProduct,
  type Receivable,
  type SaleInvoice,
} from '../schemas/sales.schema';

const emptyMeta = (params?: { page?: number; limit?: number }): PaginatedMeta => ({
  totalCount: 0,
  page: params?.page ?? 1,
  limit: params?.limit ?? 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

function parsePaginated<T>(
  schema: z.ZodType<T>,
  raw: unknown,
  params?: { page?: number; limit?: number },
): PaginatedResult<T> {
  const envelope = raw as { data?: unknown[]; meta?: Partial<PaginatedMeta> };
  const result = z.array(schema).safeParse(envelope?.data ?? []);
  const data = result.success ? result.data : [];
  return {
    data,
    meta: { ...emptyMeta(params), ...(envelope?.meta ?? {}) } as PaginatedMeta,
  };
}

export interface PosProductQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export const salesService = {
  // ── Customers ──────────────────────────────────────────────────────────────
  getCustomersAll: async (): Promise<Customer[]> => {
    const response = await apiClient.get('/sales/customers/all');
    const parsed = z.array(customerSchema).safeParse(response.data?.data ?? []);
    return parsed.success ? parsed.data : [];
  },

  getCustomersPaginated: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResult<Customer>> => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.search) query.set('search', params.search);
    if (params.isActive !== undefined)
      query.set('isActive', String(params.isActive));
    const response = await apiClient.get(
      `/sales/customers/paginated?${query.toString()}`,
    );
    return parsePaginated(customerSchema, response.data, params);
  },

  createCustomer: async (payload: CustomerPayload): Promise<Customer> => {
    const response = await apiClient.post('/sales/customers', payload);
    return customerSchema.parse(response.data.data);
  },

  updateCustomer: async (
    id: string,
    payload: CustomerPayload,
  ): Promise<Customer> => {
    const response = await apiClient.patch(`/sales/customers/${id}`, payload);
    return customerSchema.parse(response.data.data);
  },

  toggleCustomerStatus: async (id: string): Promise<void> => {
    await apiClient.patch(`/sales/customers/${id}/toggle-status`);
  },

  // ── Products for POS ───────────────────────────────────────────────────────
  getPosProducts: async (
    params: PosProductQuery,
  ): Promise<PaginatedResult<PosProduct>> => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 20));
    if (params.search) query.set('search', params.search);
    query.set('status', 'AVAILABLE');
    const response = await apiClient.get(
      `/inventory/products/paginated?${query.toString()}`,
    );
    return parsePaginated(posProductSchema, response.data, params);
  },

  // ── Sales invoices ─────────────────────────────────────────────────────────
  createSale: async (payload: unknown): Promise<SaleInvoice> => {
    const response = await apiClient.post('/sales/invoices', payload);
    return saleInvoiceSchema.parse(response.data.data);
  },

  getInvoicesPaginated: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
  }): Promise<PaginatedResult<SaleInvoice>> => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.customerId) query.set('customerId', params.customerId);
    const response = await apiClient.get(
      `/sales/invoices/paginated?${query.toString()}`,
    );
    return parsePaginated(saleInvoiceSchema, response.data, params);
  },

  getInvoiceById: async (id: string): Promise<SaleInvoice> => {
    const response = await apiClient.get(`/sales/invoices/${id}`);
    return saleInvoiceSchema.parse(response.data.data);
  },

  cancelInvoice: async (id: string): Promise<void> => {
    await apiClient.patch(`/sales/invoices/${id}/cancel`);
  },

  generateDeliveryNote: async (id: string): Promise<void> => {
    await apiClient.post(`/sales/invoices/${id}/delivery-note`);
  },

  // ── Receivables / Payments ─────────────────────────────────────────────────
  getReceivables: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<Receivable>> => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.search) query.set('search', params.search);
    const response = await apiClient.get(
      `/sales/payments/receivables?${query.toString()}`,
    );
    return parsePaginated(receivableSchema, response.data, params);
  },

  createPayment: async (payload: {
    customerId: string;
    invoiceId: string;
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
    cashRegisterSessionId?: string;
    referenceNumber?: string;
  }): Promise<void> => {
    await apiClient.post('/sales/payments', payload);
  },

  getPaymentsPaginated: async (params: {
    page?: number;
    limit?: number;
    customerId?: string;
  }): Promise<PaginatedResult<z.infer<typeof customerPaymentSchema>>> => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.customerId) query.set('customerId', params.customerId);
    const response = await apiClient.get(
      `/sales/payments/paginated?${query.toString()}`,
    );
    return parsePaginated(customerPaymentSchema, response.data, params);
  },

  // ── Delivery notes ─────────────────────────────────────────────────────────
  getDeliveryNotesPaginated: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResult<DeliveryNote>> => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.search) query.set('search', params.search);
    const response = await apiClient.get(
      `/sales/delivery-notes/paginated?${query.toString()}`,
    );
    return parsePaginated(deliveryNoteSchema, response.data, params);
  },

  getDeliveryNoteById: async (id: string): Promise<DeliveryNote> => {
    const response = await apiClient.get(`/sales/delivery-notes/${id}`);
    return deliveryNoteSchema.parse(response.data.data);
  },
};
