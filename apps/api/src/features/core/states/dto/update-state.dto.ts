import { createZodDto } from 'nestjs-zod';
import { CreateStateSchema } from './create-state.dto';

// Creamos el esquema parcial basado en el de creación
export const UpdateStateSchema = CreateStateSchema.partial();

export class UpdateStateDto extends createZodDto(UpdateStateSchema) {}
