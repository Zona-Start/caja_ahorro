import z from 'zod';

export const FilterBankAccountSchema = z.object({
  tenantId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  sortBy: z
    .enum(['id', 'accountNumber', 'accountName'])
    .optional()
    .default('id'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  accountType: z.enum(['BANK', 'CASH']).optional(),
  currencyCode: z.enum(['USD', 'EUR', 'MXN']).optional(),
});

export type FilterBankAccountDto = z.infer<typeof FilterBankAccountSchema>;
