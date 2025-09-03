'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  accountPayableAllResponseSchema,
  accountPayableMutationResponseSchema,
  accountPayableResponseOneSchema,
} from '../schemas/account-payable-api.schema';
import { AccountPayable } from '../schemas/account-payable.schema';
import { mapAccountPayableApiToForm } from '../utils';

export const getAccountsPayableAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  supplierId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  supplierInvoiceId?: number;
}) => {
  const searchParams = new URLSearchParams({
    ...(params.supplierId && { supplierId: params.supplierId.toString() }),
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.supplierInvoiceId && {
      supplierInvoiceId: params.supplierInvoiceId.toString(),
    }),
  });

  const [error, response] = await safeFetchApi(
    accountPayableAllResponseSchema,
    `/administration/accounts-payable/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching accounts payable data');
  }

  const mappedData = mapAccountPayableApiToForm(response?.data || []);

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

export const createAccountPayableAction = async (payload: AccountPayable) => {
  const { id, ...payloadWithoutId } = payload;

  const transform = {
    ...payloadWithoutId,
    originalAmount: payloadWithoutId.originalAmount.toFixed(2),
    paidAmount: payloadWithoutId.paidAmount?.toFixed(2),
    remainingAmount: payloadWithoutId.remainingAmount.toFixed(2),
  };

  const [error, data] = await safeFetchApi(
    accountPayableMutationResponseSchema,
    '/administration/accounts-payable',
    'POST',
    transform,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating account payable');
  }

  return data;
};

export const updateAccountPayableAction = async (payload: AccountPayable) => {
  const { id, ...payloadWithoutId } = payload;

  const transform = {
    ...payloadWithoutId,
    originalAmount: payloadWithoutId.originalAmount.toFixed(2),
    paidAmount: payloadWithoutId.paidAmount?.toFixed(2),
    remainingAmount: payloadWithoutId.remainingAmount.toFixed(2),
  };

  const [error, data] = await safeFetchApi(
    accountPayableMutationResponseSchema,
    `/administration/accounts-payable/${id}`,
    'PATCH',
    transform,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error updating account payable');
  }

  return data;
};

export const deleteAccountPayableAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountPayableMutationResponseSchema,
    `/administration/accounts-payable/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error deleting account payable');
  }

  return data;
};

export const getAccountPayableByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountPayableResponseOneSchema,
    `/administration/accounts-payable/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching account payable');
  }
  return data;
};

export const getAccountPayableReportAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    null, // No schema needed for binary data
    `/administration/accounts-payable/report/${id}`,
    'GET',
    null, // No body
    // 'arraybuffer', // Expect binary data
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error generating report');
  }
  return data;
};

import { supplierPaymentMutationResponseSchema } from '../../supplier-payments/schemas';
import { PayAccountPayable } from '../schemas/pay-account-payable.schema';

import { preloadedPaymentResponseSchema } from '../schemas/preloaded-payment.schema';

export const getPreloadedPaymentAction = async (id: number) => {
  const [error, response] = await safeFetchApi(
    preloadedPaymentResponseSchema,
    `/administration/accounts-payable/${id}/preloaded-payment`,
    'GET'
  );

  if (error) {
    throw new Error(error.message || 'Error fetching preloaded payment data');
  }

  return response?.data;
};

export const payAccountPayableAction = async (payload: PayAccountPayable) => {
  // Transform the payload to match CreateSupplierPaymentDto
  const paymentDto = {
    supplierId: payload.supplierId,
    totalAmount: payload.amount,
    paymentMethod: payload.paymentMethod,
    bankAccountId: payload.bankAccountId,
    bankReference: payload.bankReference,
    bankDescription: payload.paymentDescription,
    bankTransactionDate: payload.transactionDate,
    lines: [
      {
        accountsPayableId: payload.accountsPayableId,
        amount: payload.amount,
        description: payload.paymentDescription,
      },
    ],
  };

  const [error, data] = await safeFetchApi(
    supplierPaymentMutationResponseSchema,
    '/administration/supplier-payments/pay',
    'POST',
    paymentDto,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error processing payment');
  }

  return data;
};

export const saveAccountPayableAction = async (payload: AccountPayable) => {
  try {
    if (payload.id) {
      return await updateAccountPayableAction(payload);
    } else {
      return await createAccountPayableAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving account payable');
  }
};
