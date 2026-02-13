import { z } from 'zod';

// Trial Balance (Balance de Comprobación)
export const trialBalanceAccountSchema = z.object({
  accountPlanId: z.number(),
  accountCode: z.string(),
  accountName: z.string(),
  accountType: z.string(),
  accountNature: z.string(),
  level: z.number(),
  initialBalance: z.string(),
  periodDebit: z.string(),
  periodCredit: z.string(),
  currentBalance: z.string(),
});

export const trialBalanceSummarySchema = z.object({
  totalInitialDebit: z.string(),
  totalInitialCredit: z.string(),
  totalPeriodDebit: z.string(),
  totalPeriodCredit: z.string(),
  totalCurrentDebit: z.string(),
  totalCurrentCredit: z.string(),
});

export const trialBalanceResponseSchema = z.object({
  accounts: z.array(trialBalanceAccountSchema),
  summary: trialBalanceSummarySchema,
  cycleInfo: z.object({
    cycleId: z.number(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.string(),
  }),
});

export type TrialBalanceAccount = z.infer<typeof trialBalanceAccountSchema>;
export type TrialBalanceSummary = z.infer<typeof trialBalanceSummarySchema>;
export type TrialBalanceResponse = z.infer<typeof trialBalanceResponseSchema>;
