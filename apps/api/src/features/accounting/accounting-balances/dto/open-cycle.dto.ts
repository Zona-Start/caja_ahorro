import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const OpenCycleSchema = z.object({
  targetCycleId: z
    .string()
    .uuid({ message: 'El ID del ciclo destino debe ser un UUID válido' }),

  tenantId: z
    .string()
    .uuid({ message: 'El tenantId debe ser un UUID válido' })
    .optional(),
});

export class OpenCycleDto extends createZodDto(OpenCycleSchema) {}
