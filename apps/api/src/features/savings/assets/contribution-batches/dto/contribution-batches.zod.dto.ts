import { PaginationSchema } from '@/common/dto/pagination.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FilterContributionBatchSchema = PaginationSchema.extend({
  status: z.string().optional(),
  type: z.enum(['individual', 'massive']).optional(),
  movementType: z
    .enum(['contribution_patronal', 'contribution_voluntary'])
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export class FilterContributionBatchDto extends createZodDto(
  FilterContributionBatchSchema,
) {}

export const CreateContributionBatchSchema = z.object({
  tenantId: z.string().uuid().optional(),
  type: z.enum(['individual', 'massive']),
  movementType: z.enum(['contribution_patronal', 'contribution_voluntary']),
  entryDate: z.coerce.date(),
  associateId: z.string().uuid().optional(),
  description: z.string().optional(),
  amountVoluntario: z.coerce.number().optional(),
  amountPatrono: z.coerce.number().optional(),
  amountAsociado: z.coerce.number().optional(),
  totalAmount: z.coerce.number(),
  associateCount: z.coerce.number().default(1),
  accountingEntryId: z.string().uuid().optional(),
  bankTransactionId: z.string().uuid().optional(),
  bankData: z.any().optional(),
});

export type CreateContributionBatchDto = z.infer<
  typeof CreateContributionBatchSchema
>;
