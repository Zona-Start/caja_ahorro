import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const movementStatusValues = [
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'REVERSED',
  'DONE',
] as const;

export const CreateAssociateAccountMovementSchema = z.object({
  tenantId: z.string().uuid().optional(),
  associateAccountId: z.string().uuid(),
  movementType: z.string(),
  amount: z.number().positive(),
  currencyCode: z.string(),
  transactionDate: z.coerce.date(),
  description: z.string().min(1),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  status: z.enum(movementStatusValues).default('COMPLETED'),
});

export const FilterMovementsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  movementType: z.string().optional(),
});

export class CreateAssociateAccountMovementDto extends createZodDto(
  CreateAssociateAccountMovementSchema,
) {}
export class FilterMovementsDto extends createZodDto(FilterMovementsSchema) {}

export type CreateAssociateAccountMovementDtoType = z.infer<
  typeof CreateAssociateAccountMovementSchema
>;
export type FilterMovementsDtoType = z.infer<typeof FilterMovementsSchema>;
