import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BalanceSheetSchema = z.object({
  accountingCycleId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  detailLevel: z.coerce.number().int().min(1).max(5).optional().default(3),
  format: z.enum(['json', 'pdf']).optional().default('json'),
});

export class BalanceSheetDto extends createZodDto(BalanceSheetSchema) {}
