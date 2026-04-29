'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { ProductsApiResponseSchema } from '../schemas/products-api-schema';

//action para buscar los productos disponible para creditos
export const getProductsAction = async () => {
  const [error, data] = await safeFetchApi(
    ProductsApiResponseSchema,
    `/administration/inventory/products/all/getCredit`,
    'GET',
  );

  if (error) {
    throw new Error(error.message || 'Error fetching products data');
  }
  return data;
};
