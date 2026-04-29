import { z } from 'zod';
import { CycleStatusEnum } from '@/types/enum';

export const CreateAccountingCycleSchema = z.object({
  companyId: z.coerce.number().int(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.nativeEnum(CycleStatusEnum).optional(),
  description: z.string().min(1),
  closedByUser_id: z.coerce.number().int().optional(),
  closedAt: z.coerce.date().optional(),
});

export type CreateAccountingCycleDto = z.infer<typeof CreateAccountingCycleSchema>;
