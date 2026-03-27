'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { z } from 'zod';

const disbursementResponseSchema = z.object({
  loanId: z.number().optional(),
  message: z.string(),
});

export const disburseIndividualLoanAction = async (payload: any) => {
  const [error, data] = await safeFetchApi(
    disbursementResponseSchema,
    '/loan-disbursement/individual',
    'POST',
    payload,
  );

  if (error) {
    throw new Error(error.message || 'Error al desembolsar el préstamo');
  }

  return data;
};
