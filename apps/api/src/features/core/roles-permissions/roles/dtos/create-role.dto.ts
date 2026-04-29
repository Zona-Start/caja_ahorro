import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateRoleSchema = z.object({
  tenantId: z.string().uuid().min(1, "El tenant es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
