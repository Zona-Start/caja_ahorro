import { apiClient } from '@/lib/api-client';
import { purchaseOrderApiSchema, purchaseOrderListApiResponseSchema } from '../schemas/purchase-orders-api.schema';
import type { PurchaseOrderRaw } from '../schemas/purchase-orders-api.schema';
import type { PurchaseOrderApi } from '../schemas/purchase-orders-api.schema';
import type { PurchaseOrder } from '../schemas/purchase-orders.schema';

const BASE = '/purchasing/purchase-orders';

export interface PurchaseOrderFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
}

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'string' ? Number(v) : v;
}

function rawToApi(raw: PurchaseOrderRaw): PurchaseOrderApi {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    supplierId: raw.supplierId,
    supplierName: raw.supplierName ?? raw.supplier?.name ?? null,
    status: raw.status,
    orderDate: typeof raw.orderDate === 'string' ? raw.orderDate : String(raw.orderDate),
    expectedDeliveryDate: raw.expectedDeliveryDate
      ? (typeof raw.expectedDeliveryDate === 'string' ? raw.expectedDeliveryDate : String(raw.expectedDeliveryDate))
      : null,
    subtotal: toNum(raw.subtotal),
    taxAmount: raw.taxAmount != null ? toNum(raw.taxAmount) : null,
    totalAmount: toNum(raw.totalAmount),
    currencyCode: raw.currencyCode ?? null,
    observations: raw.observations ?? null,
    items: (raw.items || []).map((item) => ({
      id: item.id,
      purchaseOrderId: item.purchaseOrderId,
      lineType: item.lineType,
      productId: item.productId ?? null,
      itemId: item.itemId ?? null,
      description: item.description ?? null,
      itemName: item.itemName ?? null,
      quantity: toNum(item.quantity),
      unitCost: toNum(item.unitCost),
      totalCost: item.totalCost != null ? toNum(item.totalCost) : null,
      unitOfMeasure: null,
      taxPercent: null,
    })),
  };
}

export const PurchaseOrdersApi = {
  async list(params: PurchaseOrderFilterParams) {
    const sp = new URLSearchParams();
    sp.set('page', String(params.page || 1));
    sp.set('limit', String(params.limit || 10));
    if (params.search) sp.set('search', params.search);
    if (params.status) sp.set('status', params.status);
    if (params.supplierId) sp.set('supplierId', params.supplierId);
    if (params.startDate) sp.set('startDate', params.startDate);
    if (params.endDate) sp.set('endDate', params.endDate);
    const res = await apiClient.get(`${BASE}/paginated?${sp.toString()}`);
    return purchaseOrderListApiResponseSchema.parse(res.data);
  },

  async getById(id: string): Promise<PurchaseOrderApi> {
    const res = await apiClient.get(`${BASE}/${id}`);
    const raw = (res.data?.data ?? res.data) as PurchaseOrderRaw;
    return rawToApi(raw);
  },

  async create(body: Omit<PurchaseOrder, 'id'>) {
    const res = await apiClient.post(BASE, body);
    return res.data;
  },

  async update(id: string, body: Partial<PurchaseOrder>) {
    const res = await apiClient.patch(`${BASE}/${id}`, body);
    return res.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete(`${BASE}/${id}`);
    return res.data;
  },

  async getDefaults() {
    const res = await apiClient.get('/inventory/products/defaults');
    return res.data as {
      taxPurchases: number;
      taxSales: number;
      utilityProduct: number;
      expenditureProduct: number;
    };
  },

  async approve(id: string) {
    const res = await apiClient.patch(`${BASE}/approve/${id}`);
    return res.data;
  },

  async downloadPdf(id: string): Promise<ArrayBuffer> {
    const res = await apiClient.get(`${BASE}/pdf/${id}`, {
      responseType: 'arraybuffer',
    });
    return res.data as ArrayBuffer;
  },
};
