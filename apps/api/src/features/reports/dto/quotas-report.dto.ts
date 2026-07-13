import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const QuotasReportSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reference: z.string().optional(),
  cedula: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export class QuotasReportDto extends createZodDto(QuotasReportSchema) {}
