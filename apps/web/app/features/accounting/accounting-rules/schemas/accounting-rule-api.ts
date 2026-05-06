import z from 'zod';
import { accountingRuleSchema } from './accounting-rule.schema';

export const accountingRuleApiResponseSchema = z.object({
  data: accountingRuleSchema,
});

export const accountingRuleDeleteResponseSchema = z.any();

export const accountingRuleListApiResponseSchema = z.object({
  message: z.string().optional(),
  data: z.array(accountingRuleSchema),
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
