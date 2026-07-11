import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  tenantId: z.string().uuid().optional(),
});

export class UserQueryDto extends createZodDto(UserQuerySchema) {}
