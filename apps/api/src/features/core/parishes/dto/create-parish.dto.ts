import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateParishSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la parroquia es obligatorio')
    .describe('The name of the parish'),

  municipalityId: z
    .number()
    .positive('El ID del municipio debe ser un número positivo')
    .describe('The ID of the municipality this parish belongs to'),
});

export class CreateParishDto extends createZodDto(CreateParishSchema) {}
