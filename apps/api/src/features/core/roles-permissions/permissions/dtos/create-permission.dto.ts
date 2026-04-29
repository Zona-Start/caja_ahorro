import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePermissionSchema = z.object({
  name: z.string().min(1).max(100),
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(20),
  scope: z.string().max(20).default('own'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export class CreatePermissionDto extends createZodDto(CreatePermissionSchema) {}
