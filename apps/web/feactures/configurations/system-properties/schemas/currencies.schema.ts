import { z } from 'zod';

export const currenciesSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimalPlaces: z.number(),
  isActive: z.boolean(),
});

export const currenciesAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(currenciesSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
      nextPage: z.number().nullable(),
      previousPage: z.number().nullable(),
    })
    .optional(),
});
