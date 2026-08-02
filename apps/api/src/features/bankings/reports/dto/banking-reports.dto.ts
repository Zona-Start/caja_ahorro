import { z } from 'zod';

export const BankingReportFilterSchema = z.object({
  bankAccountId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reconciliationId: z.string().uuid().optional(),
  format: z.enum(['json', 'excel']).optional().default('json'),
  tenantId: z.string().uuid().optional(),
});
