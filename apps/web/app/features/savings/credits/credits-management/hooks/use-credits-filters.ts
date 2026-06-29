import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';
import { z } from 'zod';

export const creditsFilterSchema = z.object({
  page: z.number().int().positive().catch(1),
  limit: z.number().int().positive().catch(10),
  search: z.string().catch(''),
  status: z.string().catch(''),
  type: z.string().catch(''),
  modality: z.string().catch(''),
});

export type CreditsFilters = z.infer<typeof creditsFilterSchema>;

export function useCreditsFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      status: parseAsString.withDefault(''),
      type: parseAsString.withDefault(''),
      modality: parseAsString.withDefault(''),
    },
    { shallow: false },
  );

  const clearFilters = () =>
    setFilters({
      page: 1,
      search: '',
      status: '',
      type: '',
      modality: '',
    });

  return {
    filters,
    setFilters,
    clearFilters,
  };
}
