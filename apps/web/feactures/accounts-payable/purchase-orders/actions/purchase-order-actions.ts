'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  purchaseOrderDeleteResponseSchema,
  purchaseOrderResponseAllSchema,
  purchaseOrderResponseCountSchema,
  purchaseOrderResponseOneSchema,
} from '../schemas/purchase-order-response-api';
import { PurchaseOrder } from '../schemas/purchase-order.schema';

export const getPurchaseOrdersAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    purchaseOrderResponseAllSchema,
    `/accounts-payable/purchase-orders/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching purchase orders data');
  }

  const mappedData =
    response?.data
      ?.filter((item) => item.purchaseDate)
      .map((item) => ({
        ...item,
        purchaseDate: new Date(item.purchaseDate),
      })) || [];

  return {
    data: mappedData || [],
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
    totalAmount: payloadWithoutId.totalAmount.toFixed(2),
  };

  const [error, data] = await safeFetchApi(
    purchaseOrderResponseOneSchema,
    '/accounts-payable/purchase-orders',
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

  const [error, data] = await safeFetchApi(
    purchaseOrderResponseOneSchema,
    `/accounts-payable/purchase-orders/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error update purchase order');
  }

  return data;
};

export const deletePurchaseOrderAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    purchaseOrderResponseOneSchema,
    `/accounts-payable/purchase-orders/${id}`,
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
    `/accounts-payable/purchase-orders/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching purchase order');
  }
  return data;
};

export const getPurchaseOrdersCountAction = async () => {
  const [error, data] = await safeFetchApi(
    purchaseOrderResponseCountSchema,
    `/accounts-payable/purchase-orders/summary`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching purchase orders');
  }
  return data?.data;
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
