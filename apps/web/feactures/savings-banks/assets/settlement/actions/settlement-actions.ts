'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { associateLiquidationResponseSchema } from '../schemas/individual-settlement-api-schema';
import { settlementApiResponseSchema, settlementMutationSchema } from '../schemas/settlement-api-response';
import { Settlement } from '../schemas/settlement.schema';

export const getAssociatesByCedulaAction = async (cedula: string) => {
  const [error, data] = await safeFetchApi(
    associateLiquidationResponseSchema,
    `/savings-banks/settlement-associate/request/${cedula}`,
    'GET',
  );

  if (error) {
    //console.error('Error:', error);
    throw new Error(
      error.message || 'Error fetching associate withdrawal data',
    );
  }

  return data?.data;
};

export const getSettlementAction = async (params: {
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
    settlementApiResponseSchema,
    `/savings-banks/settlement-associate?${searchParams}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching withdrawal data');
  }

  //Transform data to match DataTable expected type
  // const tableData =
  //   response?.data?.map((item: any) => ({
  //     id: item.id,
  //     customReference: item.customReference,
  //     withdrawalTypeId: item.withdrawalTypeId,
  //     withdrawalType: item.withdrawalType,
  //     withdrawalDate: item.withdrawalDate.split('T')[0],
  //     requestedAmount: item.requestedAmount,
  //     associateCedula: item.associateCedula,
  //     associateFullname: item.associateFullname,
  //   })) || [];

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

export const createSettlementAction = async (settlement: Settlement) => {
  const { id, ...payloadWithoutId } = settlement;
  const payload = {
    associateId: Number(payloadWithoutId.associateId),
    netLiquidationAmount: Number(payloadWithoutId.netLiquidationAmount),
    totalOutstandingCreditsAtLiquidation: Number(
      payloadWithoutId.totalOutstandingCreditsAtLiquidation,
    ),
    totalOutstandingLoansAtLiquidation: Number(
      payloadWithoutId.totalOutstandingLoansAtLiquidation,
    ),
    totalSavingsBalanceAtLiquidation: Number(
      payloadWithoutId.totalSavingsBalanceAtLiquidation,
    ),
    liquidationDate: payloadWithoutId.liquidationDate
      .toISOString()
      .split('T')[0], // ISO string
    notes: payloadWithoutId.notes,
    paymentMethod: payloadWithoutId.paymentMethod,
    beneficiary: payloadWithoutId.beneficiary,
  };

  const [error, data] = await safeFetchApi(
    settlementMutationSchema,
    '/savings-banks/settlement-associate',
    'POST',
    payload,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error create withdrawal Management');
  }

  return data;
};

// export const deleteWithdrawalAction = async (id: number) => {
//   const [error, data] = await safeFetchApi(
//     withdrawalMutationSchema, // Assuming a simple response
//     `/savings-banks/withdrawal-associate/${id}`,
//     'DELETE',
//   );
//   if (error) {
//     console.error('Error:', error);
//     throw new Error(error.message || `Error delete withdrawal with ID ${id}`);
//   }
//   return data;
// };

export const saveSettlementAction = async (settlement: Settlement) => {
  try {
    return await createSettlementAction(settlement);
  } catch (error: any) {
    throw new Error(error.message || 'Error saving Settlement data');
  }
};
