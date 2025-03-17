'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import {
  categoryTypesDeleteResponseSchema,
  categoryTypesResponseSchema,
} from '../schemas/category-types-response';
import { CategoryTypes } from '../schemas/category-types-schemas';

export const createCategoryTypeAction = async (payload: CategoryTypes) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    categoryTypesResponseSchema,
    '/configurations/category-types',
    'POST',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const updateCategoryTypeAction = async (payload: CategoryTypes) => {
  const { id, ...payloadWithoutId } = payload;

  const [error, data] = await safeFetchApi(
    categoryTypesResponseSchema,
    `/configurations/category-types/${id}`,
    'PATCH',
    payloadWithoutId,
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const deleteCategoryTypeAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    categoryTypesDeleteResponseSchema,
    `/configurations/category-types/${id}`,
    'DELETE',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error);
  }

  return data;
};

export const saveCategoryTypesAction = async (payload: CategoryTypes) => {
  try {
    if (payload.id) {
      return await updateCategoryTypeAction(payload);
    } else {
      return await createCategoryTypeAction(payload);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Error saving account category types');
  }
};
