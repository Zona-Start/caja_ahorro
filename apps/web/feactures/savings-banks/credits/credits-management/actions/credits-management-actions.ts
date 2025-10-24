'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  CreditAssociateGetResponseSchema,
  CreditDeleteResponseSchema,
  creditManagementAllCountResponseSchema,
  CreditManagementMutationResponse,
  CreditManagementResponseAllSchema,
} from '../schemas/credits-management-api-response';
import { CreditManagement } from '../schemas/credits-management.schema';
import { loadAssociateApiResponseSchema } from '../schemas/individual-credit-api-schema';

export const getAssociatesByCedulaAction = async (cedula: string) => {
  const [error, data] = await safeFetchApi(
    loadAssociateApiResponseSchema,
    `/credit/request/${cedula}`,
    'GET',
  );

  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || 'Error fetching associate data');
  }
  return data;
};

export const getCreditManagementByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    CreditAssociateGetResponseSchema, // Use the schema for a single loan
    `/credit/request/byEdit/${id}`, // API endpoint for a single loan
    'GET',
  );

  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || `Error fetching loan with ID ${id}`);
  }

  // Transform data to match the LoanManagement schema expected by the form/view
  const transformedData = {
    id: String(data?.id),
    associateId: Number(data?.associateId),
    creditTypeId: String(data?.creditTypeId),
    creditModality: data?.creditModality,
    requestDate: data?.requestDate ? new Date(data.requestDate) : new Date(),
    requestedAmount: data?.requestedAmount ?? '',
    startDate: data?.startDate,
    endDate: data?.endDate,
    expensesAmount: data?.expensesAmount,
    overdraftAmount: data?.overdraftAmount ?? '',
    termMonths: data?.expensesAmount ?? '',
    interestRate: data?.totalInterest ?? '',
    installmentsCount: data?.expensesAmount ?? '',
    status: data?.status ?? '',
    notes: data?.notes,
    customReference: data?.customReference,
    creditTypeName: data?.creditTypeName,
    associateCedula: data?.associateCedula,
    associateFullname: data?.associateFullname,
    associatePhone: data?.associatePhone,
    associateEmail: data?.associateEmail,
    associateDateAdmission: data?.associateDateAdmission,
    associateIsPayrollCredit: data?.associateIsPayrollCredit,
    associateAccountId: data?.associateAccountId,
    associateAccountNumber: data?.associateAccountNumber,
    associateBalance: data?.associateBalance,
    invoiceNumber: data?.invoiceNumber,
  };

  return transformedData;
};

export const getCreditManagementAllAction = async (params: {
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
    CreditManagementResponseAllSchema,
    `/credit?${searchParams}`,
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
      associateId: item.associateId,
      creditTypeId: String(item.creditTypeId),
      creditModality: item.creditModality,
      requestDate: new Date(item.requestDate),
      requestedAmount: item.requestedAmount ?? '',
      startDate: item.startDate,
      endDate: item.endDate,
      expensesAmount: item.expensesAmount,
      overdraftAmount: item.overdraftAmount ?? '',
      termMonths: item.termMonths ?? '',
      interestRate: item.interestRate ?? '',
      installmentsCount: item.installmentsCount ?? '',
      status: item.status ?? '',
      notes: item.notes,
      customReference: item.customReference,
      creditTypeName: item.creditTypeName,
      associateCedula: item.associateCedula,
      associateFullname: item.associateFullname,
      creditTypeInterestRate: item.creditTypeInterestRate,
      creditTypeAdministrativeExpensePercentage:
        item.creditTypeAdministrativeExpensePercentage,
      creditTypeTermUnits: item.creditTypeTermUnits,
      invoiceNumber: item.invoiceNumber,
      termType: item.termType,
      termUnits: item.termUnits,
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

export const createCreditManagementAction = async (
  creditManagement: CreditManagement,
) => {
  const { id, ...payloadWithoutId } = creditManagement;
  const payload = {
    associateId: Number(payloadWithoutId.associateId),
    creditTypeId: Number(payloadWithoutId.creditTypeId),
    creditModality: payloadWithoutId.creditModality,
    requestDate: payloadWithoutId.requestDate.toISOString().split('T')[0],
    startDate: payloadWithoutId.startDate.toISOString().split('T')[0],
    endDate: payloadWithoutId.endDate,
    requestedAmount: Number(payloadWithoutId.requestedAmount),
    overdraftAmount:
      payloadWithoutId.overdraftAmount === ''
        ? null
        : Number(payloadWithoutId.overdraftAmount),
    status: payloadWithoutId.status,
    notes: payloadWithoutId.notes,
    invoiceNumber: payloadWithoutId.invoiceNumber,
    commercialHouseId: payloadWithoutId.commercialHouseId,
    creditItems: payloadWithoutId.creditItems,
    useCommercialHouse: payloadWithoutId.useCommercialHouse,
    interestRate: Number(payloadWithoutId.interestRate),
    termUnits: Number(payloadWithoutId.termUnits),
    termType: payloadWithoutId.termType,
  };

  const [error, data] = await safeFetchApi(
    CreditManagementMutationResponse,
    '/credit/request',
    'POST',
    payload,
  );

  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || 'Error create loan Management');
  }

  return data;
};

export const aprobeCreditManagementAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    CreditManagementMutationResponse, // Assuming the response is similar
    `/credit/approve/${id}`, // API endpoint for updating a single loan
    'PATCH', // Or 'PUT', depending on your API
  );
  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || `Error update credit with ID ${id}`);
  }
  return data;
};

export const deleteCreditManagementAction = async (id: number) => {
  // ... existing deleteLoanManagementAction ...
  const [error, data] = await safeFetchApi(
    CreditDeleteResponseSchema, // Assuming a simple response
    `/credit/${id}`,
    'DELETE',
  );
  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || `Error delete credit with ID ${id}`);
  }
  return data;
};

export const getCreditManagementAllCountAction = async () => {
  const [error, data] = await safeFetchApi(
    creditManagementAllCountResponseSchema, // Use the schema for a single loan
    `/credit/count`, // API endpoint for a single loan
    'GET',
  );

  if (error) {
    // console.error('Error:', error);
    throw new Error(error.message || `Error fetching credit count}`);
  }

  return data;
};
