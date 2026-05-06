import { z } from 'zod';
import { CycleStatusEnum } from './accounting-cycle-options';

export const accountingCycleSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.nativeEnum(CycleStatusEnum),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede tener más de 255 caracteres'),
  closedAt: z.coerce.date().optional().nullable(),
  closedByUser_id: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdById: z.string().optional(),
  updateById: z.string().optional().nullable(),
});

export type AccountingCycle = z.infer<typeof accountingCycleSchema>;
