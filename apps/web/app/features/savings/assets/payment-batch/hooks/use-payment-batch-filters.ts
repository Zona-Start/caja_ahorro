import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';
import { filterPaymentBatchSchema } from '../schemas/payment-batch-schema';
import type { FilterPaymentBatch } from '../schemas/payment-batch-schema';
import { z } from 'zod';

export const paymentBatchFilterSchema = filterPaymentBatchSchema;

export type PaymentBatchFilters = FilterPaymentBatch;

export function usePaymentBatchFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      status: parseAsString.withDefault('').withOptions({ shallow: false }),
      search: parseAsString.withDefault('').withOptions({ shallow: false }),
    },
    { shallow: false },
  );

  const parsedFilters: PaymentBatchFilters = {
    page: filters.page,
    limit: filters.limit,
    status: (filters.status as PaymentBatchFilters['status']) || undefined,
    search: filters.search || undefined,
  };

  return {
    filters: parsedFilters,
    setFilters,
  };
}
