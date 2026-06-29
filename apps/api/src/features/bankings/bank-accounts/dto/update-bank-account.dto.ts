import { z } from 'zod';

const accountTypeEnum = z.enum(['CHECKING', 'SAVINGS', 'CREDIT']);
const currencyCodeEnum = z.enum(['VES', 'USD', 'EUR']);

export const UpdateBankAccountSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankDirectoryId: z.string().uuid().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().regex(/^\d{20}$/).optional(),
  accountType: accountTypeEnum.optional(),
  currencyCode: currencyCodeEnum.optional(),
  openingDate: z.coerce.date().optional(),
  currentBalance: z.coerce.number().nonnegative().optional(),
  linkedChartAccountId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  openingEntryPosted: z.boolean().optional(),
  lastStatementDate: z.coerce.date().optional(),
});

export type UpdateBankAccountDto = z.infer<typeof UpdateBankAccountSchema>;
