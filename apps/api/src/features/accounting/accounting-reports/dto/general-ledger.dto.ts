import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GeneralLedgerSchema = z.object({
  accountingCycleId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  accountPlanId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(50),
  format: z.enum(['json', 'pdf']).optional().default('json'),
});

export class GeneralLedgerDto extends createZodDto(GeneralLedgerSchema) {}
