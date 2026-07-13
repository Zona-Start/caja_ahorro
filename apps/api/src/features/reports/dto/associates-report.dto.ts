import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssociatesReportSchema = z.object({
  status: z.string().optional(),
  isPayrollCredit: z.string().optional(),
  gender: z.string().optional(),
  associatedTypeId: z.string().uuid().optional(),
  payrollTypeId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export class AssociatesReportDto extends createZodDto(AssociatesReportSchema) {}
