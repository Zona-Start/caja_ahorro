import { createZodDto } from 'nestjs-zod';
import { CreateParishSchema } from './create-parish.dto';

// Esquema que hace opcionales todos los campos de CreateParishSchema
export const UpdateParishSchema = CreateParishSchema.partial();

export class UpdateParishDto extends createZodDto(UpdateParishSchema) {}
