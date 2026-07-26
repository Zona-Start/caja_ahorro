import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const JournalBookSchema = z.object({
  accountingCycleId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(50),
  format: z.enum(['json', 'pdf']).optional().default('json'),
});

export class JournalBookDto extends createZodDto(JournalBookSchema) {}
