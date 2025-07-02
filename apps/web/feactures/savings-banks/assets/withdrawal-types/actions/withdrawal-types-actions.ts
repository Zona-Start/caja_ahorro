'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  withdrawalTypesAllResponseSchema,
  withdrawalTypesMutationResponseSchema,
} from '../schemas/withdrawal-types-api.schema';
import { WithdrawalTypes } from '../schemas/withdrawal-types.schema';

// export const getWithdrawalTypesAction = async () => {
//   const [error, data] = await safeFetchApi(
//     typeLoanAllResponseSchema,
//     '/savings-banks/loan-types',
//     'GET',
//   );

//   if (error) {
//     console.error('Error:', error);
//     throw new Error(error.message || 'An unknown error occurred');
//   }

//   return {
//     data: data?.data,
//   };
// };

export const getWithdrawalTypesAction = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const searchParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  const [error, response] = await safeFetchApi(
    withdrawalTypesAllResponseSchema,
    `/savings-banks/withdrawal-types/paginated?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  const parsedData =
    response?.data?.map((item) => ({
      ...item,
      accountDebit: Number(item.accountDebit ?? 0),
      expenseAccount: Number(item.expenseAccount ?? 0),
      withdrawalLimitQuantity:
        item.withdrawalLimitQuantity !== undefined &&
        item.withdrawalLimitQuantity !== null
          ? Number(item.withdrawalLimitQuantity)
          : undefined,
      minimumAntiquityDays:
        item.minimumAntiquityDays !== undefined &&
        item.minimumAntiquityDays !== null
          ? Number(item.minimumAntiquityDays)
          : undefined,
      withdrawalFrequencyRelation:
        Number(item.withdrawalFrequencyRelation) ?? 0,
    })) || [];

  return {
    data: parsedData || [],
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

export const createWithdrawalTypesAction = async (payload: WithdrawalTypes) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    withdrawalTypesMutationResponseSchema,
    '/savings-banks/withdrawal-types',
    'POST',
    payloadWithoutId,
  );
  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const updateWithdrawalTypesAction = async (payload: WithdrawalTypes) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    withdrawalTypesMutationResponseSchema,
    `/savings-banks/withdrawal-types/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const deleteWithdrawalTypesAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    withdrawalTypesMutationResponseSchema,
    `/savings-banks/withdrawal-types/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const saveWithdrawalTypesAction = async (payload: WithdrawalTypes) => {
  try {
    if (payload.id) {
      return await updateWithdrawalTypesAction(payload);
    } else {
      return await createWithdrawalTypesAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving account withdrawal types');
  }
};
