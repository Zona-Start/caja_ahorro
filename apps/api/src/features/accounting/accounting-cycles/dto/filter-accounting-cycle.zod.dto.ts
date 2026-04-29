import { z } from 'zod';

export const FilterAccountingCycleSchema = z.object({
  page: z.coerce.number().int().optional().default(1),
  limit: z.coerce.number().int().optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.string().optional(),
});

export type FilterAccountingCycleDto = z.infer<typeof FilterAccountingCycleSchema>;
