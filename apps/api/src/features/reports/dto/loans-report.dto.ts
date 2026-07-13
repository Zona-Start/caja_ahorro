import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoansReportSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  loanTypeId: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export class LoansReportDto extends createZodDto(LoansReportSchema) {}
