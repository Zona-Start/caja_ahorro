import { z } from 'zod';

export const accountingRuleDetailSchema = z.object({
  id: z.string().uuid().optional(),
  ruleId: z.string().uuid().optional(),
  accountRole: z.string().nullable().optional(),
  movementType: z.enum(['DEBIT', 'CREDIT']),
  isAuxiliary: z.boolean().optional().default(false),
  isAuxiliarySupplier: z.boolean().optional().default(false),
  formula: z.string().nullable().optional(),
  accountPlanId: z.string().uuid().nullable().optional(),
});

export const accountingRuleSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string(),
  category: z.enum([
    'SAVINGS_BANK',
    'PURCHASING',
    'BANKING',
    'ACCOUNTING',
    'INVENTORY',
  ]),
  operationType: z.string().min(1, 'El tipo de operación es requerido'),
  referenceValue: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().nullable().default(true),
  details: z.array(accountingRuleDetailSchema).optional(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  updatedById: z.string().optional().nullable(),
});

export type AccountingRule = z.infer<typeof accountingRuleSchema>;
export type AccountingRuleDetail = z.infer<typeof accountingRuleDetailSchema>;
