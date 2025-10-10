import z from 'zod';

export const accountPlanApiResponseSchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
  code: z.string(),
  // .regex(/^[\d-]+$/, 'El código debe contener solo números y puntos'),
  name: z.string(),
  description: z.string().optional().nullable(),
  accountType: z.enum([
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE',
    'MEMORANDUM',
  ]),
  nature: z.enum(['DEBIT', 'CREDIT']).optional(),
  level: z.number(),
  allowsMovements: z.boolean(),
  isActive: z.boolean(),
  parentAccountId: z.number().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdById: z.number().optional(),
  updateById: z.number().optional(),
});

export const accountPlanListApiResponseSchema = z.object({
  message: z.string(),
  data: z.array(accountPlanApiResponseSchema),
});
