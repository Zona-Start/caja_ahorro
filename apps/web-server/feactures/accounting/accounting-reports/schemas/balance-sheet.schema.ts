import { z } from 'zod';

// Balance Sheet (Balance General)
export const balanceSheetAccountSchema: z.ZodType<any> = z.object({
  accountPlanId: z.number(),
  accountCode: z.string(),
  accountName: z.string(),
  level: z.number(),
  balance: z.string(),
  children: z
    .array(z.lazy((): z.ZodType<any> => balanceSheetAccountSchema))
    .optional(),
});

export const balanceSheetSectionSchema = z.object({
  title: z.string(),
  accounts: z.array(balanceSheetAccountSchema),
  total: z.string(),
});

export const balanceSheetResponseSchema = z.object({
  assets: balanceSheetSectionSchema,
  liabilities: balanceSheetSectionSchema,
  equity: balanceSheetSectionSchema,
  totals: z.object({
    totalAssets: z.string(),
    totalLiabilities: z.string(),
    totalEquity: z.string(),
    totalLiabilitiesAndEquity: z.string(),
  }),
  cycleInfo: z.object({
    cycleId: z.number(),
    description: z.string(),
    endDate: z.string(),
  }),
});

export type BalanceSheetAccount = z.infer<typeof balanceSheetAccountSchema>;
export type BalanceSheetSection = z.infer<typeof balanceSheetSectionSchema>;
export type BalanceSheetResponse = z.infer<typeof balanceSheetResponseSchema>;
