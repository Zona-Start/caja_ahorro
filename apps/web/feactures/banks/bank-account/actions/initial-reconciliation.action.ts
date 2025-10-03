'use server';

import { safeFetchApi } from '@/lib';
import { bankConcilitianInitialResponseSchema } from '../schemas/bank-account-response-api';
import { InitialReconciliation } from '../schemas/bank-conciliation-initial.schema';

export const createBankConciliationInitialAction = async (
  initialReconciliation: InitialReconciliation,
) => {
  const [error, data] = await safeFetchApi(
    bankConcilitianInitialResponseSchema,
    '/bakings/bank-accounts/initial-reconciliation',
    'POST',
    initialReconciliation,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error create associate');
  }

  return data;
};
