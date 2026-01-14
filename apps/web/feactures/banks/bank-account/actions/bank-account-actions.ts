'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  bankAccountAllResponseSchema,
  bankAccountDeleteResponseSchema,
  bankAccountResponseAllSchema,
  bankAccountResponseOneSchema,
} from '../schemas/bank-account-response-api';
import { BankAccount } from '../schemas/bank-account.schema';

//action para traer todas las cuenta de banco de la caja
export const getBankAccountAllAction = async () => {
  const [error, response] = await safeFetchApi(
    bankAccountAllResponseSchema,
    '/bakings/bank-accounts',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching bank account data');
  }

  return response;
};

export const getBankAccountAction = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  accountType?: string;
  currencyCode?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.accountType && { accountType: params.accountType }),
    ...(params.currencyCode && { currencyCode: params.currencyCode }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    bankAccountResponseAllSchema,
    `/bakings/bank-accounts/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching bank account data');
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

export const createBankAccountAction = async (bankAccount: BankAccount) => {
  const { id, ...payloadWithoutId } = bankAccount;

  const [error, data] = await safeFetchApi(
    bankAccountResponseOneSchema,
    '/bakings/bank-accounts',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error create associate');
  }

  return data;
};

export const updateBankAccountAction = async (bankAccount: BankAccount) => {
  const { id, ...payloadWithoutId } = bankAccount;

  const [error, data] = await safeFetchApi(
    bankAccountResponseOneSchema,
    `/bakings/bank-accounts/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error update bank account');
  }

  return data;
};

export const deleteBankAccountAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    bankAccountDeleteResponseSchema,
    `/bakings/bank-accounts/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error delete bank account');
  }

  return data;
};

export const getBankAccountByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    bankAccountResponseOneSchema,
    `/bakings/bank-accounts/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching associate data');
  }
  return data;
};

export const saveBankAccountAction = async (bankAccount: BankAccount) => {
  try {
    if (bankAccount.id) {
      return await updateBankAccountAction(bankAccount);
    } else {
      return await createBankAccountAction(bankAccount);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving associate data');
  }
};

export const generateOpeningEntryAction = async (
  id: number,
  payload: {
    currentBalance: number;
    accountingRuleId: number;
    openingDate: string;
  },
) => {
  const [error, data] = await safeFetchApi(
    bankAccountResponseOneSchema, // Usamos este para validar que devuelve algo coherente
    `/bakings/bank-accounts/generate-opening-entry/${id}`,
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error generating opening entry');
  }

  return data;
};
