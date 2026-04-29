import { z } from 'zod';

// Income Statement (Estado de Resultados)
export const incomeStatementAccountSchema: z.ZodType<any> = z.object({
  accountPlanId: z.number(),
  accountCode: z.string(),
  accountName: z.string(),
  level: z.number(),
  balance: z.string(),
  children: z
    .array(z.lazy((): z.ZodType<any> => incomeStatementAccountSchema))
    .optional(),
});

export const incomeStatementSectionSchema = z.object({
  title: z.string(),
  accounts: z.array(incomeStatementAccountSchema),
  total: z.string(),
});

export const incomeStatementResponseSchema = z.object({
  revenue: incomeStatementSectionSchema,
  expenses: incomeStatementSectionSchema,
  result: z.object({
    grossProfit: z.string(),
    operatingIncome: z.string(),
    netIncome: z.string(),
  }),
  cycleInfo: z.object({
    cycleId: z.number(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
});

export type IncomeStatementAccount = z.infer<
  typeof incomeStatementAccountSchema
>;
export type IncomeStatementSection = z.infer<
  typeof incomeStatementSectionSchema
>;
export type IncomeStatementResponse = z.infer<
  typeof incomeStatementResponseSchema
>;
