import z from 'zod';
import { accountingRuleSchema } from './accounting-rule.schema';

export const accountingRuleApiResponseSchema = z.object({
  data: accountingRuleSchema,
});

export const accountingRuleListApiResponseSchema = z.object({
  data: z.array(accountingRuleSchema),
});

export const accountingRuleDeleteResponseSchema = z.any();
