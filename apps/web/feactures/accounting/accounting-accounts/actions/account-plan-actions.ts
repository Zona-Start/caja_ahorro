'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { ACCOUNT_LEVELS, ACCOUNT_TYPES } from '../schemas/account-plan-options';
import {
  AccountPlan,
  accountPlanDeleteResponseSchema,
  accountPlanListResponseSchema,
  accountPlanPaginationResponseSchema,
  accountPlanResponseSchema,
} from '../schemas/account-plan.schema';

const transformAccountPlanData = async (accounts: AccountPlan[]) => {
  const transformedAccounts = await Promise.all(
    accounts.map(async (account) => {
      // Get parent account info if exists
      let parentAccountCode = 'Ninguno';
      if (account.parent_account_id !== null) {
        const [error, parentData] = await safeFetchApi(
          accountPlanResponseSchema,
          `/account-plan/${account.parent_account_id}`,
          'GET',
        );
        if (!error && parentData) {
          parentAccountCode = parentData.data.code;
        }
      }

      return {
        ...account,
        typeLabel:
          ACCOUNT_TYPES[account.type as keyof typeof ACCOUNT_TYPES] ||
          account.type,
        levelLabel:
          ACCOUNT_LEVELS[account.level as keyof typeof ACCOUNT_LEVELS] ||
          account.level,
        parentAccountCode,
      };
    }),
  );

  return transformedAccounts;
};

export const getAccountPlansAction = async () => {
  const [error, data] = await safeFetchApi(
    accountPlanListResponseSchema,
    '/account-plan',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  const transformedData = await transformAccountPlanData(data?.data || []);
  return { ...data, data: transformedData };
};

export const getPaginatedAccountPlansAction = async (params: {
  page?: number;
  limit?: number;
  level?: string;
  type?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  let searchType = '';
  let searchValue = '';

  if (params.search) {
    if (/^\d/.test(params.search)) {
      searchType = 'code';
    } else {
      searchType = 'name';
    }
    searchValue = params.search.toUpperCase();
  }

  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(searchType && { searchType }),
    ...(searchValue && { search: searchValue }),
    ...(params.type && { type: params.type }),
    ...(params.level && { level: params.level }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    accountPlanPaginationResponseSchema,
    `/account-plan/pagination?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  const transformedData = await transformAccountPlanData(response?.data || []);

  return {
    data: transformedData,
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

export const createAccountPlanAction = async (payload: AccountPlan) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    accountPlanResponseSchema,
    '/account-plan',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const updateAccountPlanAction = async (payload: AccountPlan) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    accountPlanResponseSchema,
    `/account-plan/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const deleteAccountPlanAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountPlanDeleteResponseSchema,
    `/account-plan/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const getAccountPlanByIdAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    accountPlanResponseSchema,
    `/account-plan/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const saveAccountPlanAction = async (payload: AccountPlan) => {
  try {
    if (payload.id) {
      return await updateAccountPlanAction(payload);
    } else {
      return await createAccountPlanAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving account plan data');
  }
};
