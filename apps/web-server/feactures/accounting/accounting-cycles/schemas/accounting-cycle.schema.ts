import { z } from 'zod';
import { CycleStatusEnum } from './accounting-cycle-options';

export const accountingCycleSchema = z.object({
  id: z.number().optional(),
  companyId: z.number().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.nativeEnum(CycleStatusEnum),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede tener más de 255 caracteres'),
  closedAt: z.date().optional().nullable(),
  closedByUser_id: z.number().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdById: z.number().optional(),
  updateById: z.number().optional(),
});

export type AccountingCycle = z.infer<typeof accountingCycleSchema>;
