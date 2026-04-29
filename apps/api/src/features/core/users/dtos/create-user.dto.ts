import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CreateUserSchema = z.object({
  username: z.string().min(1, "Username is required").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullname: z.string().min(1, "Fullname is required"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["active", "inactive", "blocked"]).optional().default("active"),
  isSystemAdmin: z.boolean().optional().default(false),
  tenantId: z.string().uuid().optional(),
  roleId: z.string().uuid().optional(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
