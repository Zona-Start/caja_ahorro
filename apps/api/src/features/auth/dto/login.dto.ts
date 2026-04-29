import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginInputSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export class LoginInput extends createZodDto(LoginInputSchema) {}
