import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssociatesBalanceSchema = z.object({
  accountingCycleId: z.string().uuid().optional(),
  associateId: z.string().uuid().optional(),
  accountPlanId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(50),
  format: z.enum(['json', 'pdf']).optional().default('json'),
});

export class AssociatesBalanceDto extends createZodDto(AssociatesBalanceSchema) {}
