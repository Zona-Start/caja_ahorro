import { z } from 'zod';

export const accountingRuleDetailSchema = z.object({
  id: z.string().optional(),
  ruleId: z.string().optional(),
  accountRole: z.string().nullable().optional(),
  movementType: z.enum(['DEBIT', 'CREDIT']),
  isAuxiliary: z.boolean().optional().default(false),
  isAuxiliarySupplier: z.boolean().optional().default(false),
  formula: z.string().nullable().optional(),
  accountPlanId: z.string().nullable(),
});

export const accountingRuleSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string(),
  category: z.enum([
    'SAVINGS_BANK',
    'ADMINISTRATIVE',
    'BANKING',
    'ACCOUNTING',
    'INVENTORY',
  ]),
  operationType: z.string().min(1, 'El tipo de operación es requerido'),
  referenceValue: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().nullable().default(true),
  details: z.array(accountingRuleDetailSchema).optional(),
});

export type AccountingRule = z.infer<typeof accountingRuleSchema>;
export type AccountingRuleDetail = z.infer<typeof accountingRuleDetailSchema>;
