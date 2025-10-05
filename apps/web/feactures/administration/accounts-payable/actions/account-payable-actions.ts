'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { supplierPaymentMutationResponseSchema } from '../../supplier-payments/schemas';
// import { AccountPayable } from '../../supplier-payments/schemas/account-payable.schema';
import {
  accountPayableAllResponseSchema,
  accountPayableMutationResponseSchema,
  accountPayableResponseOneSchema,
  supplierMutationResponseSchema,
} from '../schemas/account-payable-api.schema';
import { AdvancePayment } from '../schemas/advance-payment.schema';
import { PayAccountPayable } from '../schemas/pay-account-payable.schema';
import { mapAccountPayableApiToForm } from '../utils';

//action consutlar datos de las cuentas por pagar
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

// export const createAccountPayableAction = async (payload: AccountPayable) => {
//   const { id, ...payloadWithoutId } = payload;

//   const transform = {
//     ...payloadWithoutId,
//     originalAmount: payloadWithoutId.originalAmount.toFixed(2),
//     paidAmount: payloadWithoutId.paidAmount?.toFixed(2),
//     remainingAmount: payloadWithoutId.remainingAmount.toFixed(2),
//   };

//   const [error, data] = await safeFetchApi(
//     accountPayableMutationResponseSchema,
//     '/administration/accounts-payable',
//     'POST',
//     transform,
//   );

//   if (error) {
//     console.error('Error:', error);
//     throw new Error(error.message || 'Error creating account payable');
//   }

//   return data;
// };

// export const updateAccountPayableAction = async (payload: AccountPayable) => {
//   const { id, ...payloadWithoutId } = payload;

//   const transform = {
//     ...payloadWithoutId,
//     originalAmount: payloadWithoutId.originalAmount.toFixed(2),
//     paidAmount: payloadWithoutId.paidAmount?.toFixed(2),
//     remainingAmount: payloadWithoutId.remainingAmount.toFixed(2),
//   };

//   const [error, data] = await safeFetchApi(
//     accountPayableMutationResponseSchema,
//     `/administration/accounts-payable/${id}`,
//     'PATCH',
//     transform,
//   );

//   if (error) {
//     console.error('Error:', error);
//     throw new Error(error.message || 'Error updating account payable');
//   }

//   return data;
// };

//actions para anular una cuenta por pagar
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

// action para crear anticipos
export const createAdvancePaymentAction = async (payload: AdvancePayment) => {
  const advancePaymentDto = {
    supplierId: payload.supplierId,
    amount: payload.amount,
    observations: payload.observations,
  };

  const [error, data] = await safeFetchApi(
    supplierMutationResponseSchema,
    '/administration/accounts-payable/advance',
    'POST',
    advancePaymentDto,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error creating advance payment');
  }

  return data;
};

// export const saveAccountPayableAction = async (payload: AccountPayable) => {
//   try {
//     if (payload.id) {
//       return await updateAccountPayableAction(payload);
//     } else {
//       return await createAccountPayableAction(payload);
//     }
//   } catch (error: any) {
//     throw new Error(error.message || 'Error saving account payable');
//   }
// };

//action para autorizar pago a una cuenta por pagar
export const authorizeAccountPayableAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountPayableMutationResponseSchema,
    `/administration/accounts-payable/authorize/${id}`,
    'PATCH',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error authorizing account payable');
  }

  return data;
};
