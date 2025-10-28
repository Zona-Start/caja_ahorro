import z from 'zod';
import { accountingConfigurationSchema } from './accounting-configuration.schema';

export const accountingConfigurationApiResponseSchema = z.object({
  message: z.string(),
  data: accountingConfigurationSchema,
});

export const accountingConfigurationListApiResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountingConfigurationSchema),
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

export const accountingConfigurationDeleteResponseSchema = z.object({
  message: z.string(),
});
