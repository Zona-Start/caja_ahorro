import { createZodDto } from 'nestjs-zod';
import { CreateMunicipalitySchema } from './create-municipality.dto';

// Creamos el esquema parcial basado en el de creación
export const UpdateMunicipalitySchema = CreateMunicipalitySchema.partial();

export class UpdateMunicipalityDto extends createZodDto(
  UpdateMunicipalitySchema,
) {}
