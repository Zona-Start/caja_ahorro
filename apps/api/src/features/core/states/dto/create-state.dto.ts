import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateStateSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del estado es obligatorio')
    .describe('The name of the state'),
});

export class CreateStateDto extends createZodDto(CreateStateSchema) {}
