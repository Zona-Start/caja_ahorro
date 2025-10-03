'use server';

import { AssociatesResponseOneSchema } from '@/feactures/savings-banks/partners/associates/schemas/associates-response-api';
import { safeFetchApi } from '@/lib';
import { loadAssestApiResponseSchema } from '../schemas/individual-load-api-schema';
import { LoadAssest } from '../schemas/individual-load-schema';

export const getAssociatesByCedulaAction = async (cedula: string) => {
  const [error, data] = await safeFetchApi(
    AssociatesResponseOneSchema,
    `/savings-banks/associates/cedula/${cedula}`,
    'GET',
  );

  if (error) {
    //console.error('Error:', error);
    throw new Error(error.message || 'Error fetching associate data');
  }
  return data;
};

export const saveIndividualLoadAction = async (payload: LoadAssest) => {
  console.log('Payload Action:', payload);

  const [error, data] = await safeFetchApi(
    loadAssestApiResponseSchema,
    '/savings-banks/individual-load',
    'POST',
    payload,
  );

  if (error) {
    //console.error('Error:', error);
    throw new Error(error.message || 'Error create associate');
  }

  return data;
};
