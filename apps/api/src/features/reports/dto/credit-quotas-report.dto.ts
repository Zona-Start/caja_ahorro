import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreditQuotasReportSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reference: z.string().optional(),
  cedula: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export class CreditQuotasReportDto extends createZodDto(CreditQuotasReportSchema) {}
