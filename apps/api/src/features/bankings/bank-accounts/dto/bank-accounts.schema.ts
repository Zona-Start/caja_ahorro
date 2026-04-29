import { AccountTypeEnum, CurrencyCodeEnum } from '@/types/enum';
import { z } from 'zod';

export const CreateBankAccountSchema = z.object({
  tenantsId: z.string().uuid(),
  accountName: z.string().min(1),
  accountNumber: z.string().min(1),
  bankId: z.number().int().positive(),
  currencyCode: z.nativeEnum(CurrencyCodeEnum),
  initialBalance: z.number().default(0),
  bankDirectoryId: z.string().uuid(),
  accountType: z.nativeEnum(AccountTypeEnum),
  openingDate: z.coerce.date(),
  linkedChartAccountId: z.string().uuid(),
  isActive: z.boolean().default(true),
  openingEntryPosted: z.boolean().default(false),
  currentBalance: z.coerce.number().default(0),
  ruleAccountId: z.string().uuid().nullable(),
  lastStatementDate: z.coerce.date(),
});

export type CreateBankAccountDto = z.infer<typeof CreateBankAccountSchema>;
