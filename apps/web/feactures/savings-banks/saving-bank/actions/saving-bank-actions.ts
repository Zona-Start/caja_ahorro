'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { z } from 'zod';
import { SavingBankFormValue, savingFormSchema } from '../schemas/saving-bank';

// Response schema for the API
const savingBankResponseSchema = z.object({
  message: z.string(),
  data: savingFormSchema,
});

const savingBankListResponseSchema = z.object({
  message: z.string(),
  data: z.array(savingFormSchema),
});

export const getSavingBankAction = async () => {
  const [error, data] = await safeFetchApi(
    savingBankListResponseSchema,
    '/savings-bank',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const createSavingBankAction = async (payload: SavingBankFormValue) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    savingBankResponseSchema,
    '/savings-bank',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const updateSavingBankAction = async (payload: SavingBankFormValue) => {
  const { id, ...payloadWithoutId } = payload;
  console.log(payloadWithoutId);
  console.log(id);
  console.log(`/savings-bank/${id}`);

  const [error, data] = await safeFetchApi(
    savingBankResponseSchema,
    `/savings-bank/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const saveSavingBankAction = async (payload: SavingBankFormValue) => {
  try {
    // First try to get existing data
    const existingData = await getSavingBankAction();

    if (existingData && existingData.data.length > 0) {
      // If data exists, update
      return await updateSavingBankAction(payload);
    } else {
      // If no data exists, create new
      return await createSavingBankAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving savings bank data');
  }
};
