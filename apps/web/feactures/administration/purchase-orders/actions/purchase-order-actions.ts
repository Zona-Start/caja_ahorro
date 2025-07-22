'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  purchaseOrderAllResponseSchema,
  purchaseOrderMutationResponseSchema,
  purchaseOrderResponseOneSchema,
} from '../schemas/purchase-order-api.schema';
import { PurchaseOrder } from '../schemas/purchase-order.schema';

export const getPurchaseOrdersAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  supplierId?: number;
  orderType?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.supplierId && { supplierId: params.supplierId.toString() }),
    ...(params.orderType && { orderType: params.orderType }),
    ...(params.startDate && { startDate: params.startDate.toISOString() }),
    ...(params.endDate && { endDate: params.endDate.toISOString() }),
  });

  const [error, response] = await safeFetchApi(
    purchaseOrderAllResponseSchema,
    `/administration/purchase-orders/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching purchase orders data');
  }

  return {
    data: response?.data || [],
    meta: response?.meta || {
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
};

export const createPurchaseOrderAction = async (payload: PurchaseOrder) => {
  const { id, ...payloadWithoutId } = payload;

  const transform = {
    ...payloadWithoutId,
    orderDate: payloadWithoutId.orderDate.toISOString(),
    expectedDeliveryDate: payloadWithoutId.expectedDeliveryDate?.toISOString(),
    subtotal: payloadWithoutId.subtotal.toFixed(2),
    taxAmount: payloadWithoutId.taxAmount?.toFixed(2),
    totalAmount: payloadWithoutId.totalAmount.toFixed(2),
    items: payloadWithoutId.items.map(item => ({
      ...item,
      unitCost: item.unitCost.toFixed(6),
      totalCost: item.totalCost.toFixed(2),
    })),
  };

  const [error, data] = await safeFetchApi(
    purchaseOrderMutationResponseSchema,
    '/administration/purchase-orders',
    'POST',
    transform,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error create purchase order');
  }

  return data;
};

export const updatePurchaseOrderAction = async (payload: PurchaseOrder) => {
  const { id, ...payloadWithoutId } = payload;

  const transform = {
    ...payloadWithoutId,
    orderDate: payloadWithoutId.orderDate.toISOString(),
    expectedDeliveryDate: payloadWithoutId.expectedDeliveryDate?.toISOString(),
    subtotal: payloadWithoutId.subtotal.toFixed(2),
    taxAmount: payloadWithoutId.taxAmount?.toFixed(2),
    totalAmount: payloadWithoutId.totalAmount.toFixed(2),
    items: payloadWithoutId.items.map(item => ({
      ...item,
      unitCost: item.unitCost.toFixed(6),
      totalCost: item.totalCost.toFixed(2),
    })),
  };

  const [error, data] = await safeFetchApi(
    purchaseOrderMutationResponseSchema,
    `/administration/purchase-orders/${id}`,
    'PATCH',
    transform,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error update purchase order');
  }

  return data;
};

export const deletePurchaseOrderAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    purchaseOrderMutationResponseSchema,
    `/administration/purchase-orders/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error delete purchase order');
  }

  return data;
};

export const getPurchaseOrderByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    purchaseOrderResponseOneSchema,
    `/administration/purchase-orders/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching purchase order');
  }
  return data;
};

export const savePurchaseOrderAction = async (payload: PurchaseOrder) => {
  try {
    if (payload.id) {
      return await updatePurchaseOrderAction(payload);
    } else {
      return await createPurchaseOrderAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving purchase order');
  }
};
