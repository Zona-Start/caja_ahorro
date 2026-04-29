'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  creditPaymentApiResponseSchema,
  creditPaymentMutationSchema,
} from '../schemas/credits-paid-api-response';
import { CreditPaid } from '../schemas/credits-paid.schema';
import { creditAssociate } from '../schemas/individual-credits-api-schema';

export const getAssociatesByCedulaAction = async (cedula: string) => {
  const [error, data] = await safeFetchApi(
    creditAssociate,
    `/credit-paid/request/${cedula}`,
    'GET',
  );

  if (error) {
    //console.error('Error:', error);
    throw new Error(error.message || 'Error fetching associate data');
  }
  return data;
};

export const getCreditPaidAllAction = async (params: {
  page?: number;
  limit?: number;
  bank?: string;
  type?: string;
  method?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  let searchType = '';
  let searchValue = '';

  if (params.search) {
    if (/^\d/.test(params.search)) {
      searchType = 'cedula';
    } else {
      searchType = 'fullname';
    }
    searchValue = params.search.toUpperCase();
  }

  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(searchType && { searchType }),
    ...(searchValue && { search: searchValue }),
    ...(params.type && { type: params.type }),
    ...(params.bank && { bank: params.bank }),
    ...(params.method && { method: params.method }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    creditPaymentApiResponseSchema,
    `/credit-paid?${searchParams}`,
    'GET',
  );

  if (error) {
    //console.error('Error:', error);
    throw new Error(error.message || 'Error fetching associates data');
  }

  // Transform data to match DataTable expected type
  const tableData =
    response?.data?.map((item: any) => ({
      id: item.id,
      customReference: item.customReference,
      paymentDate: item.paymentDate.split('T')[0],
      paymentType: item.paymentType,
      paymentMethod: item.paymentMethod,
      bankName: item.bankName,
      transactionReference: item.transactionReference,
      amount: item.amount,
      balancePending: item.balancePending,
      associateCedula: item.associateCedula,
      associatesFullname: item.associatesFullname,
    })) || [];

  return {
    data: tableData || [],
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

export const createCreditPaidAction = async (creditPaid: CreditPaid) => {
  const { id, creditPaidId, ...payloadWithoutId } = creditPaid;
  const payload = {
    ...payloadWithoutId,
    creditId: Number(payloadWithoutId.creditId),
    bankId: Number(payloadWithoutId.bankId),
    amount: Number(payloadWithoutId.amount),
    paymentDate: payloadWithoutId.paymentDate.toISOString().split('T')[0],
  };

  const [error, data] = await safeFetchApi(
    creditPaymentMutationSchema,
    '/credit-paid',
    'POST',
    payload,
  );

  if (error) {
    //console.error('Error:', error);
    throw new Error(error.message || 'Error create credit Management');
  }

  return data;
};

export const updateCreditPaidAction = async (creditPaid: CreditPaid) => {
  const { creditPaidId, ...payloadWithoutId } = creditPaid;
  // const payload = {
  //   associateId: Number(payloadWithoutId.associateId),
  //   loanTypeId: Number(payloadWithoutId.loanTypeId),
  //   loanModality: payloadWithoutId.loanModality,
  //   requestDate: payloadWithoutId.requestDate.toISOString().split('T')[0],
  //   startDate: payloadWithoutId.startDate.toISOString().split('T')[0],
  //   requestedAmount: Number(payloadWithoutId.requestedAmount),
  //   expensesAmount: Number(payloadWithoutId.expensesAmount),
  //   overdraftAmount:
  //     payloadWithoutId.overdraftAmount === ''
  //       ? null
  //       : Number(payloadWithoutId.overdraftAmount),
  //   paymentMethod: payloadWithoutId.paymentMethod,
  //   disbursementAccountId: Number(payloadWithoutId.disbursementAccountId),
  //   status: payloadWithoutId.status,
  //   notes: payloadWithoutId.notes,
  // };

  const [error, data] = await safeFetchApi(
    creditPaymentMutationSchema, // Assuming the response is similar
    `/credit-paid/${creditPaidId}`, // API endpoint for updating a single loan
    'PATCH', // Or 'PUT', depending on your API
    //payload,
  );
  if (error) {
    //console.error('Error:', error);
    throw new Error(
      error.message || `Error update credit with ID ${creditPaidId}`,
    );
  }
  return data;
};

export const deleteCreditPaidAction = async (id: number) => {
  // ... existing deleteLoanManagementAction ...
  const [error, data] = await safeFetchApi(
    creditPaymentMutationSchema, // Assuming a simple response
    `/credit-paid/${id}`,
    'DELETE',
  );
  if (error) {
    //console.error('Error:', error);
    throw new Error(error.message || `Error delete credit with ID ${id}`);
  }
  return data;
};

export const saveCreditPaidAction = async (creditPaid: CreditPaid) => {
  try {
    if (creditPaid.creditPaidId) {
      return await updateCreditPaidAction(creditPaid);
    } else {
      return await createCreditPaidAction(creditPaid);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving credit paid data');
  }
};
