import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
// Importamos el BASE, no el que tiene el refine
import { CreateAccountingEntryBaseSchema } from './create-accounting-entry.dto';
import { UpdateAccountingEntryDetailSchema } from './update-accounting-entry-detail.dto';

export const UpdateAccountingEntrySchema = CreateAccountingEntryBaseSchema.omit(
  {
    details: true,
    entryDate: true,
  },
)
  .partial() // Esto hace que todos los campos del base sean opcionales
  .extend({
    // Redefinimos los campos específicos para el update
    details: z
      .array(UpdateAccountingEntryDetailSchema)
      .min(2, { message: 'Debe tener al menos dos detalles' })
      .optional(),

    entryDate: z.coerce.date().optional(),
  });

export class UpdateAccountingEntryDto extends createZodDto(
  UpdateAccountingEntrySchema,
) {}
