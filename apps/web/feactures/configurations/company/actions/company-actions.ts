'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  CompanyFormValue,
  companyApiAllResponseSchema,
  companyApiOneResponseSchema,
} from '../schemas/company';

export const getCompanyAction = async () => {
  const [error, data] = await safeFetchApi(
    companyApiAllResponseSchema,
    '/core/company',
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const createCompanyAction = async (payload: CompanyFormValue) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    companyApiOneResponseSchema,
    '/core/company',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const updateCompanyAction = async (payload: CompanyFormValue) => {
  const { id, ...payloadWithoutId } = payload;
  const [error, data] = await safeFetchApi(
    companyApiOneResponseSchema,
    `/core/company/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'An unknown error occurred');
  }

  return data;
};

export const saveCompanyAction = async (payload: CompanyFormValue) => {
  try {
    // First try to get existing data
    const existingData = await getCompanyAction();

    if (existingData && existingData.data.length > 0) {
      // If data exists, update
      return await updateCompanyAction(payload);
    } else {
      // If no data exists, create new
      return await createCompanyAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error company data');
  }
};
