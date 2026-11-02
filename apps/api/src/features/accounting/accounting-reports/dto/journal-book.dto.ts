import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const JournalBookSchema = z.object({
  accountingCycleId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(50),
  format: z.enum(['json', 'pdf']).optional().default('json'),
});

export class JournalBookDto extends createZodDto(JournalBookSchema) {}
