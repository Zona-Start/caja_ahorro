import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const inventoryFixedAssetsFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  assetStatus: z.string().optional(),
  categoryId: z.string().optional(),
  depreciationMethod: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type InventoryFixedAssetsFilters = z.infer<
  typeof inventoryFixedAssetsFilterSchema
>;

export function useInventoryFixedAssetsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = inventoryFixedAssetsFilterSchema.parse(
    Object.fromEntries(searchParams.entries()),
  );

  const setFilters = (
    newFilters: Partial<InventoryFixedAssetsFilters>,
  ) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });
    if (!('page' in newFilters)) {
      params.set('page', '1');
    }
    setSearchParams(params, { preventScrollReset: true });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', String(filters.limit || 10));
    setSearchParams(params, { preventScrollReset: true });
  };

  return { filters, setFilters, clearFilters };
}
