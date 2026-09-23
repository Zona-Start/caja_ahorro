import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TrialBalanceSchema = z.object({
  accountingCycleId: z
    .string({ required_error: 'El ciclo contable es requerido.' })
    .uuid({ message: 'El ciclo contable debe ser un UUID válido.' }),
  startDate: z
    .string({ required_error: 'La fecha desde es requerida.' })
    .min(1, 'La fecha desde es requerida.'),
  endDate: z
    .string({ required_error: 'La fecha hasta es requerida.' })
    .min(1, 'La fecha hasta es requerida.'),
  onlyWithMovements: z.enum(['true', 'false']).optional().default('true'),
  format: z.enum(['json', 'pdf']).optional().default('json'),
});

export class TrialBalanceDto extends createZodDto(TrialBalanceSchema) {}
