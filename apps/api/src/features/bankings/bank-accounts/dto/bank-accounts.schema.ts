import { z } from 'zod';

export const CreateBankAccountSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankDirectoryId: z.string().uuid(),
  accountName: z.string().optional(),
  accountNumber: z.string().min(1),
  accountType: z.string().min(1),
  currencyCode: z.string().min(1),
  openingDate: z.coerce.date().optional(),
  currentBalance: z.coerce.number().optional(),
  linkedChartAccountId: z.string().uuid(),
  isActive: z.boolean().optional().default(true),
  openingEntryPosted: z.boolean().optional().default(false),
  ruleAccountId: z.string().uuid().optional(),
  lastStatementDate: z.coerce.date().optional(),
});

export type CreateBankAccountDto = z.infer<typeof CreateBankAccountSchema>;
