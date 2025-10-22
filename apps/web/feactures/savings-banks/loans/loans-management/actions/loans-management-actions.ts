'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { loadAssociateApiResponseSchema } from '../schemas/individual-load-api-schema';
import {
  LoanAssociateGetResponseSchema,
  loanManagementAllCountResponseSchema,
  LoanManagementMutationResponse,
  LoanManagementResponseAllSchema,
  LoansDeleteResponseSchema,
} from '../schemas/loans-management-api-response';
import { LoanManagement } from '../schemas/loans-management.schema';

export const getAssociatesByCedulaAction = async (cedula: string) => {
  const [error, data] = await safeFetchApi(
    loadAssociateApiResponseSchema,
    `/loan/request/${cedula}`,
    'GET',
  );

  if (error) {
    //console.error('Error:', error);
    throw new Error(error.message || 'Error fetching associate data');
  }
  return data;
};

export const getLoanManagementByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    LoanAssociateGetResponseSchema, // Use the schema for a single loan
    `/loan/request/byEdit/${id}`, // API endpoint for a single loan
    'GET',
  );

  if (error) {
    //console.error('Error:', error);
    throw new Error(error.message || `Error fetching loan with ID ${id}`);
  }

  // Transform data to match the LoanManagement schema expected by the form/view
  const transformedData = {
    id: String(data?.id),
    associateId: Number(data?.associateId),
    loanTypeId: String(data?.loanTypeId),
    loanModality: data?.loanModality,
    requestDate: data?.requestDate ? new Date(data.requestDate) : new Date(),
    requestedAmount: Number(data?.requestedAmount).toFixed(2) ?? '',
    startDate: data?.startDate,
    endDate: data?.endDate,
    expensesAmount: data?.expensesAmount,
    overdraftAmount: data?.overdraftAmount ?? '',
    paymentMethod: data?.paymentMethod ?? '',
    disbursementAccountId: String(data?.disbursementAccountId) ?? '',
    termMonths: data?.expensesAmount ?? '',
    interestRate: data?.totalInterest ?? '',
    installmentsCount: data?.expensesAmount ?? '',
    status: data?.status ?? '',
    notes: data?.notes,
    customReference: data?.customReference,
    loanTypeName: data?.loanTypeName,
    associateCedula: data?.associateCedula,
    associateFullname: data?.associateFullname,
    associatePhone: data?.associatePhone,
    associateEmail: data?.associateEmail,
    associateDateAdmission: data?.associateDateAdmission,
    associateIsPayrollCredit: data?.associateIsPayrollCredit,
    associateAccountId: data?.associateAccountId,
    associateAccountNumber: data?.associateAccountNumber,
    associateBalance: Number(data?.associateBalance).toFixed(2),
  };

  return transformedData;
};

export const getLoanManagementAllAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  modality?: string;
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
    ...(params.status && { status: params.status }),
    ...(params.type && { type: params.type }),
    ...(params.modality && { modality: params.modality }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    LoanManagementResponseAllSchema,
    `/loan?${searchParams}`,
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
      associateId: item.associateId,
      loanTypeId: String(item.loanTypeId),
      loanModality: item.loanModality,
      requestDate: new Date(item.requestDate),
      requestedAmount: item.requestedAmount ?? '',
      startDate: item.startDate,
      endDate: item.endDate,
      expensesAmount: item.expensesAmount,
      overdraftAmount: item.overdraftAmount ?? '',
      paymentMethod: item.paymentMethod ?? '',
      disbursementAccountId: item.disbursementAccountId ?? '',
      termMonths: item.termMonths ?? '',
      interestRate: item.interestRate ?? '',
      installmentsCount: item.installmentsCount ?? '',
      status: item.status ?? '',
      notes: item.notes,
      customReference: item.customReference,
      loanTypeName: item.loanTypeName,
      associateCedula: item.associateCedula,
      associateFullname: item.associateFullname,
      disbursedAmount: item.disbursedAmount,
      totalInterest: item.totalInterest,
      totalPayable: item.totalPayable,
      approvalDate: item.approvalDate,
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

export const createLoanManagementAction = async (
  loanManagement: LoanManagement,
) => {
  const { id, ...payloadWithoutId } = loanManagement;
  const payload = {
    associateId: Number(payloadWithoutId.associateId),
    loanTypeId: Number(payloadWithoutId.loanTypeId),
    loanModality: payloadWithoutId.loanModality,
    requestDate: payloadWithoutId.requestDate.toISOString().split('T')[0],
    startDate: payloadWithoutId.startDate.toISOString().split('T')[0],
    requestedAmount: Number(payloadWithoutId.requestedAmount),
    overdraftAmount:
      payloadWithoutId.overdraftAmount === ''
        ? null
        : Number(payloadWithoutId.overdraftAmount),
    paymentMethod: payloadWithoutId.paymentMethod,
    disbursementAccountId: Number(payloadWithoutId.disbursementAccountId),
    status: payloadWithoutId.status,
    notes: payloadWithoutId.notes,
    interestRate: Number(payloadWithoutId.interestRate),
    termUnits: Number(payloadWithoutId.termUnits),
    termType: payloadWithoutId.termType,
  };

  const [error, data] = await safeFetchApi(
    LoanManagementMutationResponse,
    '/loan/request',
    'POST',
    payload,
  );

  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || 'Error create loan Management');
  }

  return data;
};

export const aprobeLoanManagementAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    LoanManagementMutationResponse, // Assuming the response is similar
    `/loan/approve/${id}`, // API endpoint for updating a single loan
    'PATCH', // Or 'PUT', depending on your API
  );
  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || `Error update loan with ID ${id}`);
  }
  return data;
};

export const deleteLoanManagementAction = async (id: number) => {
  // ... existing deleteLoanManagementAction ...
  const [error, data] = await safeFetchApi(
    LoansDeleteResponseSchema, // Assuming a simple response
    `/loan/${id}`,
    'DELETE',
  );
  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || `Error delete loan with ID ${id}`);
  }
  return data;
};

export const getLoanManagementAllCountAction = async () => {
  const [error, data] = await safeFetchApi(
    loanManagementAllCountResponseSchema, // Use the schema for a single loan
    `/loan/count`, // API endpoint for a single loan
    'GET',
  );

  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || `Error fetching loan count}`);
  }

  return data;
};
