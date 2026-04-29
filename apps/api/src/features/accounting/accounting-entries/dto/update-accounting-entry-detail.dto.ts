import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreateAccountingEntryDetailSchema } from './create-accounting-entry-detail.dto';

// Accedemos al esquema interno antes del refine
const baseSchema =
  CreateAccountingEntryDetailSchema instanceof z.ZodEffects
    ? CreateAccountingEntryDetailSchema._def.schema
    : CreateAccountingEntryDetailSchema;

export const UpdateAccountingEntryDetailSchema = baseSchema.partial().extend({
  id: z
    .string()
    .uuid({ message: 'El ID del detalle debe ser un UUID válido' })
    .optional(),
});

export class UpdateAccountingEntryDetailDto extends createZodDto(
  UpdateAccountingEntryDetailSchema,
) {}
