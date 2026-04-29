import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const RoleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  tenantId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export class RoleQueryDto extends createZodDto(RoleQuerySchema) {}
