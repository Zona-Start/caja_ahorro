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

export const accountingRuleDetailApiSchema = z.object({
  id: z.string().optional(),
  ruleId: z.string().optional(),
  accountRole: z.string().nullable().optional(),
  movementType: z.enum(['DEBIT', 'CREDIT']),
  isAuxiliary: z.boolean().optional().default(false),
  isAuxiliarySupplier: z.boolean().optional().default(false),
  formula: z.string().nullable().optional(),
  accountPlanId: z.string().nullable(),
});

export const accountingRuleApiSchema = z.array(
  z.object({
    id: z.string().optional(),
    companyId: z.number(),
    category: z.string(),
    operationType: z.string().min(1, 'El tipo de operación es requerido'),
    referenceValue: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().nullable().default(true),
    details: z.array(accountingRuleDetailApiSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
    tenantId: z.string(),
    createdById: z.string().nullable(),
    updatedById: z.string().nullable(),
  }),
);
