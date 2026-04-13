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
  const { includeBankingDetails, ...rest } = payload;
  const [error, data] = await safeFetchApi(
    loadAssestApiResponseSchema,
    '/savings-banks/individual-load',
    'POST',
    rest,
  );

  if (error) {
    //console.error('Error:', error);
    throw new Error(error.message || 'Error create associate');
  }

  return data?.message;
};

export const downloadTemplateIndividualLoadAction = async () => {
  const [error, data] = await safeFetchApi(
    null,
    '/savings-banks/individual-load/template-bulk',
    'GET',
    undefined,
    { responseType: 'arraybuffer' },
  );

  if (error) {
    throw new Error(error.message || 'Error al descargar la plantilla');
  }

  // Convert arraybuffer to base64
  return Buffer.from(data as any, 'binary').toString('base64');
};

export const bulkUploadIndividualLoadAction = async (formData: FormData) => {
  const [error, data] = await safeFetchApi(
    null,
    '/savings-banks/individual-load/bulk',
    'POST',
    formData,
  );

  if (error) {
    throw new Error(error.message || 'Error en la carga masiva');
  }

  return data;
};
