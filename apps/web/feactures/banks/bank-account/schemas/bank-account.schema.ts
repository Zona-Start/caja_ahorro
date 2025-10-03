import { z } from 'zod';

export const bankAccountSchema = z
  .object({
    id: z.number().optional(),
    companyId: z.number(),
    bankDirectoryId: z.number().min(1, { message: 'requerido' }),
    accountNumber: z
      .string()
      .min(20, { message: 'requerido' })
      .max(20, { message: 'máximo 20 dígitos' }),
    accountName: z.string().min(1, { message: 'requerido' }),
    accountType: z.string().min(1, { message: 'requerido' }),
    currencyCode: z.string(),
    openingDate: z.date().optional().nullable(),
    currentBalance: z.number().optional(),
    lastStatementBalance: z.number().optional(),
    lastStatementDate: z.date().optional().nullable(),
    linkedChartAccountId: z.number().min(1, { message: 'requerido' }),
    isActive: z.boolean(),
    openingEntryPosted: z.boolean().optional(),
    openingConciliationPosted: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.lastStatementBalance && data.lastStatementBalance > 0) {
        return !!data.lastStatementDate;
      }
      return true;
    },
    {
      message: 'La fecha del último extracto es requerida',
      path: ['lastStatementDate'],
    },
  );

export type BankAccount = z.infer<typeof bankAccountSchema>;
