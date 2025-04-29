import { z } from 'zod';

export const bankAccountSchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
  bankDirectoryId: z.number().min(1, { message: 'requerido' }),
  accountNumber: z
    .string()
    .min(20, { message: 'requerido' })
    .max(20, { message: 'máximo 20 dígitos' }),
  accountName: z.string().optional(),
  accountType: z.string().min(1, { message: 'requerido' }),
  currencyCode: z.string(),
  openingDate: z.date().optional(),
  currentBalance: z.number().optional(),
  lastStatementBalance: z.number().optional(),
  lastStatementDate: z.date().optional(),
  linkedChartAccountId: z.number().min(1, { message: 'requerido' }),
  isActive: z.boolean(),
});

export type BankAccount = z.infer<typeof bankAccountSchema>;
