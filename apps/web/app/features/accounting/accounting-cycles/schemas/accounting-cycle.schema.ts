import { z } from 'zod';
import { CycleStatusEnum } from './accounting-cycle-options';

export const accountingCycleSchema = z.object({
  id: z.string().optional(),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  status: z.nativeEnum(CycleStatusEnum),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede tener más de 255 caracteres'),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  createdById: z.string().optional().nullable(),
  updatedById: z.string().optional().nullable(),
});

export const accountingCycleFormSchema = z.object({
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción no puede tener más de 255 caracteres'),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(CycleStatusEnum),
});

export type AccountingCycle = z.infer<typeof accountingCycleSchema>;
export type AccountingCycleForm = z.infer<typeof accountingCycleFormSchema>;
