import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CloseCycleSchema = z.object({
  tenantId: z
    .string()
    .uuid({ message: 'El tenantId debe ser un UUID válido' })
    .optional(),

  isFiscalYearEnd: z
    .boolean({
      invalid_type_error: 'isFiscalYearEnd debe ser un valor booleano',
    })
    .default(false)
    .optional(),
});

export class CloseCycleDto extends createZodDto(CloseCycleSchema) {}
