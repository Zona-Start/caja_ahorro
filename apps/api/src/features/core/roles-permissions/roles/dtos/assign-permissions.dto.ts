import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PermissionParamSchema = z.object({
  id: z.string().uuid().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  scope: z.string().optional(),
});

export const AssignPermissionsSchema = z.object({
  permissions: z.array(z.union([z.string(), PermissionParamSchema])),
});

export class AssignPermissionsDto extends createZodDto(AssignPermissionsSchema) {}
