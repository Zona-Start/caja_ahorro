import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HaberesReportSchema = z.object({
  type: z.string().optional(),
  cedula: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export class HaberesReportDto extends createZodDto(HaberesReportSchema) {}
