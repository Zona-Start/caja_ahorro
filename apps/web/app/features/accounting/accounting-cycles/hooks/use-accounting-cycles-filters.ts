import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { z } from 'zod';

export const accountingCyclesFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AccountingCyclesFilters = z.infer<
  typeof accountingCyclesFilterSchema
>;

export function useAccountingCyclesFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      status: parseAsString.withDefault(''),
      startDate: parseAsString.withDefault(''),
      endDate: parseAsString.withDefault(''),
    },
    { shallow: false },
  );

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      status: '',
      startDate: '',
      endDate: '',
    });
  };

  return { filters, setFilters, clearFilters };
}
