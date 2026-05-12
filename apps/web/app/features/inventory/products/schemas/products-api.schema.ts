import { z } from 'zod';
import { productSchema } from './products.schema';

export const productApiResponseSchema = z.object({
  data: productSchema,
});

export const productDeleteResponseSchema = z.unknown();

export const productListApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(productSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean().optional().nullable(),
      hasPreviousPage: z.boolean().optional().nullable(),
      nextPage: z.number().optional().nullable(),
      previousPage: z.number().optional().nullable(),
    })
    .nullable()
    .optional(),
});
