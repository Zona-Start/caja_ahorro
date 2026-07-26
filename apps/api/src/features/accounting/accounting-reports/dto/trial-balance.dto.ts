import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TrialBalanceSchema = z.object({
  accountingCycleId: z.string().uuid().optional(),
  level: z.coerce.number().int().min(1).max(9).optional(),
  onlyWithMovements: z
    .enum(['true', 'false'])
    .optional()
    .default('true'),
  format: z.enum(['json', 'pdf']).optional().default('json'),
});

export class TrialBalanceDto extends createZodDto(TrialBalanceSchema) {}
