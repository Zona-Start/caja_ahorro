import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  q: parseAsString, // q for general search
  status: parseAsString,
  supplierId: parseAsInteger,
  startDate: parseAsIsoDate,
  endDate: parseAsIsoDate,
  tab: parseAsString.withDefault('history'),
  isAuthorizePayment: parseAsString.withDefault('true'),
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
