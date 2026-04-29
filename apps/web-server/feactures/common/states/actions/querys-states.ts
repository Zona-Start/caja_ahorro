'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { statesSchema } from '../schemas/states-schemas';

export const getStatesAction = async () => {
  const [error, data] = await safeFetchApi(statesSchema, 'core/states', 'GET');

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error fetching states data');
  }

  // Ensure data is an array
  return data;
};
