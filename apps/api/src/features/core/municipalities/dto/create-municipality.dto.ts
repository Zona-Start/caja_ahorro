import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateMunicipalitySchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del municipio es obligatorio')
    .describe('The name of the municipality'),

  stateId: z
    .number()
    .positive('El ID del estado debe ser un número positivo')
    .describe('The ID of the state this municipality belongs to'),
});

export class CreateMunicipalityDto extends createZodDto(
  CreateMunicipalitySchema,
) {}
