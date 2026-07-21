import { apiClient } from '@/lib/api-client';
import {
  supplierInvoiceApiSchema,
  supplierInvoiceDeleteResponseSchema,
  supplierInvoiceListResponseSchema,
  supplierInvoiceResponseSchema,
} from '../schemas/supplier-invoice-api.schema';
import { type SupplierInvoiceMutation } from '../schemas/supplier-invoice.schema';
import type { CreditNoteForm, DebitNoteForm } from '../schemas/supplier-invoice.schema';

export interface SupplierInvoicesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierId?: number;
}

export const supplierInvoicesService = {
  getAll: async (params: SupplierInvoicesQueryParams) => {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.supplierId ? { supplierId: String(params.supplierId) } : {}),
    });

    const response = await apiClient.get(
      `/purchasing/supplier-invoices/paginated?${query.toString()}`,
    );

    try {
      return supplierInvoiceListResponseSchema.parse(response.data);
    } catch {
      const data = supplierInvoiceApiSchema.array().parse(response.data);
      return {
        data,
        meta: {
          totalItems: data.length,
          itemCount: data.length,
          itemsPerPage: params.limit ?? 10,
          totalPages: Math.ceil(data.length / (params.limit ?? 10)),
          currentPage: params.page ?? 1,
        },
      };
    }
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/purchasing/supplier-invoices/${id}`);
    return supplierInvoiceResponseSchema.parse(response.data).data;
  },

  create: async (payload: SupplierInvoiceMutation) => {
    const clean = JSON.parse(JSON.stringify(payload), (_, v) => v === null ? undefined : v);
    const response = await apiClient.post('/purchasing/supplier-invoices', clean);
    return supplierInvoiceResponseSchema.parse(response.data).data;
  },

  update: async (id: number, payload: SupplierInvoiceMutation) => {
    const clean = JSON.parse(JSON.stringify(payload), (_, v) => v === null ? undefined : v);
    const response = await apiClient.patch(`/purchasing/supplier-invoices/${id}`, clean);
    return supplierInvoiceResponseSchema.parse(response.data).data;
  },

  remove: async (id: number) => {
    const response = await apiClient.delete(`/purchasing/supplier-invoices/${id}`);
    return supplierInvoiceDeleteResponseSchema.parse(response.data);
  },

  save: async (payload: SupplierInvoiceMutation & { id?: number }) => {
    return payload.id
      ? supplierInvoicesService.update(payload.id, payload)
      : supplierInvoicesService.create(payload);
  },

  approve: async (id: string) => {
    const response = await apiClient.post(`/purchasing/supplier-invoices/${id}/approve`);
    return response.data;
  },

  createCreditNote: async (payload: CreditNoteForm) => {
    const response = await apiClient.post(
      '/purchasing/supplier-invoices/credit-notes',
      payload,
    );
    return response.data;
  },

  createDebitNote: async (payload: DebitNoteForm) => {
    const response = await apiClient.post(
      '/purchasing/supplier-invoices/debit-notes',
      payload,
    );
    return response.data;
  },
};
