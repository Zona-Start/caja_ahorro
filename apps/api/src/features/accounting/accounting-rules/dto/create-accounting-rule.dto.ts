import { z } from 'zod';

export const CreateAccountingRuleDetailSchema = z.object({
  id: z.string().uuid().optional(),
  ruleId: z.string().uuid().optional(),
  accountRole: z.string().optional(),
  movementType: z.enum(['DEBIT', 'CREDIT']),
  formula: z.string().optional(),
  accountPlanId: z.string().uuid().optional(),
  isAuxiliary: z.boolean().default(false).optional(),
  isAuxiliarySupplier: z.boolean().default(false).optional(),
});

export const CreateAccountingRuleSchema = z.object({
  tenantId: z.string().uuid(),
  category: z.string().min(1),
  operationType: z.string().min(1),
  referenceValue: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true).optional(),
  details: z.array(CreateAccountingRuleDetailSchema),
});

export type CreateAccountingRuleDto = z.infer<
  typeof CreateAccountingRuleSchema
>;
