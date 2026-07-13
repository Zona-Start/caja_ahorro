import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreditsReportSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  creditTypeId: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export class CreditsReportDto extends createZodDto(CreditsReportSchema) {}
