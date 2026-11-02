import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SudecaSchema = z.object({
  accountingCycleId: z.string().uuid(),
  quarter: z.coerce.number().int().min(1).max(4),
});

export class SudecaDto extends createZodDto(SudecaSchema) {}

export const SUDECA_REPORT_TYPES = [
  'financial-situation',
  'income-statement',
  'trial-balance',
] as const;

export type SudecaReportType = (typeof SUDECA_REPORT_TYPES)[number];
