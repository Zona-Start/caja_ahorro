import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const VariationsReportSchema = z.object({
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export class VariationsReportDto extends createZodDto(VariationsReportSchema) {}
