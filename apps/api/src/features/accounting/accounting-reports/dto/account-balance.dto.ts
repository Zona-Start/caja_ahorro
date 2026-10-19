import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AccountBalanceSchema = z.object({
  accountingCycleId: z.string().uuid().optional(),
  accountPlanId: z.string().uuid(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(50),
  format: z.enum(['json', 'pdf']).optional().default('json'),
});

export class AccountBalanceDto extends createZodDto(AccountBalanceSchema) {}
