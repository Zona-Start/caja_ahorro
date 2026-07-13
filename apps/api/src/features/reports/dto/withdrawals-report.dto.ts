import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const WithdrawalsReportSchema = z.object({
  cedula: z.string().optional(),
  withdrawalTypeId: z.string().optional(),
  reference: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['pdf', 'excel']).optional().default('pdf'),
});

export class WithdrawalsReportDto extends createZodDto(WithdrawalsReportSchema) {}
