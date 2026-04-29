import { CycleStatusEnum } from '@/types/enum';
import { z } from 'zod';

export const UpdateAccountingCycleSchema = z.object({
  tenantId: z.coerce.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.nativeEnum(CycleStatusEnum).optional(),
  description: z.string().optional(),
});

export type UpdateAccountingCycleDto = z.infer<
  typeof UpdateAccountingCycleSchema
>;
