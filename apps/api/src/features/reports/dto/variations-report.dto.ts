import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const VariationsReportSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export class VariationsReportDto extends createZodDto(VariationsReportSchema) {}
