import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const currenciesFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }, z.boolean().optional()),
});

export type CurrenciesFilters = z.infer<typeof currenciesFilterSchema>;

export function useCurrenciesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = currenciesFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (newFilters: Partial<CurrenciesFilters>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params, { preventScrollReset: true });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    setSearchParams(params, { preventScrollReset: true });
  };

  return { filters, setFilters, clearFilters };
}