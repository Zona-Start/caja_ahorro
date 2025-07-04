'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { loanAssociate } from '../schemas/individual-load-api-schema';
import {
  loanPaymentApiResponseSchema,
  loanPaymentMutationSchema,
} from '../schemas/loans-paid-api-response';
import { LoanPaid } from '../schemas/loans-paid.schema';

export const getAssociatesByCedulaAction = async (cedula: string) => {
  const [error, data] = await safeFetchApi(
    loanAssociate,
    `/loan-paid/request/${cedula}`,
    'GET',
  );

  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || 'Error fetching associate data');
  }
  return data;
};



export const getLoanPaidAllAction = async (params: {
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
    loanPaymentApiResponseSchema,
    `/loan-paid?${searchParams}`,
    'GET',
  );

  if (error) {
    // console.error('Error:', error);
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
      associateFullname: item.associateFullname,
      paymentStatus: item.paymentStatus,
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

export const createLoanPaidAction = async (loanPaid: LoanPaid) => {
  const { id, loanPaidId, ...payloadWithoutId } = loanPaid;
  const payload = {
    ...payloadWithoutId,
    loanId: Number(payloadWithoutId.loanId),
    bankId: Number(payloadWithoutId.bankId),
    amount: Number(payloadWithoutId.amount),
    paymentDate: payloadWithoutId.paymentDate.toISOString().split('T')[0],
  };

  const [error, data] = await safeFetchApi(
    loanPaymentMutationSchema,
    '/loan-paid',
    'POST',
    payload,
  );

  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || 'Error create loan Management');
  }

  return data;
};

export const updateLoanPaidAction = async (loanPaid: LoanPaid) => {
  const { loanPaidId, ...payloadWithoutId } = loanPaid;
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
    loanPaymentMutationSchema, // Assuming the response is similar
    `/loan-paid/${loanPaidId}`, // API endpoint for updating a single loan
    'PATCH', // Or 'PUT', depending on your API
    //payload,
  );
  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || `Error update loan with ID ${loanPaidId}`);
  }
  return data;
};

export const deleteLoanPaidAction = async (id: number) => {
  // ... existing deleteLoanManagementAction ...
  const [error, data] = await safeFetchApi(
    loanPaymentMutationSchema, // Assuming a simple response
    `/loan-paid/${id}`,
    'DELETE',
  );
  return data;
};

export const saveLoanPaidAction = async (loanPaid: LoanPaid) => {
  try {
    if (loanPaid.loanPaidId) {
      return await updateLoanPaidAction(loanPaid);
    } else {
      return await createLoanPaidAction(loanPaid);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving associate data');
  }
};
