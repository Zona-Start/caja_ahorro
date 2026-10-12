import { movementTypeSchema, paginationQuerySchema } from '@repo/contracts';
import { createZodDto } from 'nestjs-zod';

export class MemberPaginationQuery extends createZodDto(
  paginationQuerySchema,
) {}

export const memberMovementQuerySchema = paginationQuerySchema.extend({
  movementType: movementTypeSchema,
});

export class MemberMovementQuery extends createZodDto(
  memberMovementQuerySchema,
) {}
