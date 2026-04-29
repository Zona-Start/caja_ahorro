import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ChangePasswordSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
