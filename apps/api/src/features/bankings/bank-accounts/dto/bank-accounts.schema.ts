import { z } from 'zod';

const accountTypeEnum = z.enum(['CHECKING', 'SAVINGS', 'CREDIT']);
const currencyCodeEnum = z.enum(['VES', 'USD', 'EUR']);

export const CreateBankAccountSchema = z.object({
  tenantId: z.string().uuid().optional(),
  bankDirectoryId: z.string().uuid(),
  accountName: z.string().optional(),
  accountNumber: z
    .string()
    .regex(/^\d{20}$/, 'El número de cuenta debe tener exactamente 20 dígitos'),
  accountType: accountTypeEnum,
  currencyCode: currencyCodeEnum,
  openingDate: z.coerce.date().optional(),
  currentBalance: z.coerce.number().nonnegative().optional(),
  linkedChartAccountId: z.string().uuid().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateBankAccountDto = z.infer<typeof CreateBankAccountSchema>;
