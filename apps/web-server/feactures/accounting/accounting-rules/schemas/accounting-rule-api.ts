import z from 'zod';
import { accountingRuleSchema } from './accounting-rule.schema';

export const accountingRuleApiResponseSchema = accountingRuleSchema;

export const accountingRuleListApiResponseSchema =
  z.array(accountingRuleSchema);

export const accountingRuleDeleteResponseSchema = z.any();
